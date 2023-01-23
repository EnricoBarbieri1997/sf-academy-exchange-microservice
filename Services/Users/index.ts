import * as pg from "pg"
import * as grpc from '@grpc/grpc-js'
import * as protoLoader from '@grpc/proto-loader'
import {join} from "path"
import {env} from "process"
import {randomBytes, pbkdf2 as callbackPbkdf2} from "crypto"
import {promisify} from "util"
import {SignUpData} from "./gRPC/Typescript/exchange/SignUpData"
import {OperationOutcome} from "./gRPC/Typescript/exchange/OperationOutcome"
import { LoginData } from "./gRPC/Typescript/exchange/LoginData"
import { LoginResponse } from "./gRPC/Typescript/exchange/LoginResponse"
import { DepositData } from "./gRPC/Typescript/exchange/DepositData"
import { WithdrawData } from "./gRPC/Typescript/exchange/WithdrawData"
import { BuyData } from "./gRPC/Typescript/exchange/BuyData"
import { TransactionListFilters } from "./gRPC/Typescript/exchange/TransactionListFilters"
import { TransactionList } from "./gRPC/Typescript/exchange/TransactionList"
import { ExchangeClient } from "./gRPC/Typescript/exchange/Exchange"

const hashIterations = 10000
const pbkdf2 = promisify(callbackPbkdf2)

if(env.PROTO_PATH === undefined) throw "Proto path missing"
const exchangePackageDefinition = protoLoader.loadSync(join(__dirname, env.PROTO_PATH, "exchange.proto"))
const exhangeProtoDescriptor = grpc.loadPackageDefinition(exchangePackageDefinition)
const exchangeService = exhangeProtoDescriptor.exchange as any
const exchange = new exchangeService.Exchange('exchange:9000', grpc.credentials.createInsecure()) as ExchangeClient

const postgresClient = new pg.Client({
	user: process.env.DATABASE_USER,
	host: "database",
	password: process.env.DATABASE_PASSWORD,
	database: "Exchanger"
})
postgresClient.connect().then(() =>
{
	if(env.PROTO_PATH === undefined) throw "Proto path missing"
	const packageDefinition = protoLoader.loadSync(join(__dirname, env.PROTO_PATH, "users.proto"))
	const protoDescriptor = grpc.loadPackageDefinition(packageDefinition)
	
	const usersService = protoDescriptor.exchange as any
	
	const server = new grpc.Server()
	async function signUpFunction({ login, user }: SignUpData): Promise<OperationOutcome> {
		if(login?.email === undefined) throw "Missing email paramter"
		if(login.password === undefined) throw "Missing password paramter"
		if(user?.name === undefined) throw "Missing name paramter"
		if(user?.iban === undefined) throw "Missing iban paramter"

		const salt = randomBytes(128/8).toString('base64')
		const saltedPassword = (await pbkdf2(login.password, salt, hashIterations, 64, "sha512")).toString('base64')

		const query = {
			name: 'insert-user',
			text: 'INSERT INTO "Users" (email, password, name, iban, salt)' + 
				' VALUES ($1, $2, $3, $4, $5)',
			values: [login.email, saltedPassword, user.name, user.iban, salt],
		}
		try
		{
			await postgresClient.query(query)
		}
		catch(e)
		{
			return {
				success: false,
			}
		}
	
		return {
			success: true,
		}
	}
	async function loginFunction({ email, password }: LoginData): Promise<LoginResponse> {
		if(email === undefined) throw "Missing email paramter"
		if(password === undefined) throw "Missing password paramter"

		const query = {
			name: 'select-user',
			text: 'SELECT * FROM "Users" WHERE email=$1',
			values: [email],
		}
		try
		{
			const res = await postgresClient.query(query)
			if(res.rowCount != 1) throw "No user found"
			const user = res.rows[0]
			const saltedPassword = (await pbkdf2(password, user.salt, hashIterations, 64, "sha512")).toString('base64')

			if(user.password == saltedPassword) return {
				id: user.id,
			}
		}
		catch(e)
		{
			throw "Invalid query " + e
		}

		throw "Invalid credentials"
	}
	async function balances(user: number)
	{
		const query = {
			name: 'balance',
			text: `
			SELECT coalesce(gained.value, 0) - coalesce(spent.value, 0) as balance, coalesce(spent.currency, gained.currency) as currency
			FROM (
			SELECT SUM(coalesce(spent_value, 0)) AS value, spent_currency as currency
			FROM "Transactions"
			WHERE "user"=$1 AND spent_currency IS NOT NULL
			GROUP BY spent_currency
			) as spent FULL JOIN (
			SELECT SUM(coalesce(gained_value, 0)) AS value, gained_currency as currency
			FROM "Transactions"
			WHERE "user"=$1 AND gained_currency IS NOT NULL
			GROUP BY gained_currency
			) as gained
			ON spent.currency = gained.currency
			`,
			values: [user]
		}
		return new Map<String, Number>((await postgresClient.query(query)).rows.map(b => [b.currency, b.balance]))
	}
	async function depositFunction({user, amount}: DepositData): Promise<OperationOutcome>
	{
		if(user === undefined) throw "Missing user paramter"
		if(amount?.value === undefined) throw "Missing value paramter"
		if(amount?.currency === undefined) throw "Missing currency paramter"

		const query = {
			name: 'deposit',
			text: 'INSERT INTO "Transactions" ("user", gained_value, gained_currency) VALUES ($1, $2, $3)',
			values: [user, amount.value, amount.currency],
		}

		try
		{
			await postgresClient.query(query)
			return {
				success: true
			}
		}
		catch(e)
		{
			throw "Invalid query" + e
		}

		return {
			success: false,
		}
	}
	async function withdrawFunction({user, amount}: WithdrawData): Promise<OperationOutcome>
	{
		if(user === undefined) throw "Missing user paramter"
		if(amount?.value === undefined) throw "Missing value paramter"
		if(amount?.currency === undefined) throw "Missing currency paramter"

		const userBalances = await balances(user)
		const canWithdraw = (userBalances.get(amount.currency) ?? 0) >= amount.value

		if(!canWithdraw) throw "Insufficient funds"

		const query = {
			name: 'withdraw',
			text: 'INSERT INTO "Transactions" ("user", spent_value, spent_currency) VALUES ($1, $2, $3)',
			values: [user, amount.value, amount.currency],
		}

		try
		{
			await postgresClient.query(query)
			return {
				success: true
			}
		}
		catch(e)
		{
			throw "Invalid query" + e
		}

		return {
			success: false,
		}
	}
	async function buyFunction({user, from, to}: BuyData): Promise<OperationOutcome>
	{

		if(user === undefined) throw "Missing user paramter"
		if(from?.value === undefined) throw "Missing from value paramter"
		if(from?.currency === undefined) throw "Missing from currency paramter"
		if(to === undefined) throw "Missing to paramter"

		const userBalances = await balances(user)
		const canWithdraw = userBalances.get(from.currency) ?? 0 >= from.value

		if(!canWithdraw) throw "Insufficient funds"
		const toBuy = await new Promise((resolve, reject) => exchange.Exchange({
			value: from.value,
			from: from.currency,
			to: to,
		}, (err, res) =>
		{
			if(err) reject(err)
			else if(res === undefined) reject("Target currency not found")
			else resolve(res?.value)
		}))

		const query = {
			name: 'buy',
			text: 'INSERT INTO "Transactions" ("user", spent_value, spent_currency, gained_value, gained_currency) VALUES ($1, $2, $3, $4, $5)',
			values: [user, from.value, from.currency, toBuy, to],
		}

		await postgresClient.query(query)
		return {
			success: true
		}
	}
	async function listTransactionsFunction({user, date, currency}: TransactionListFilters): Promise<TransactionList>
	{
		const parameters: any[] = [user]
		if(date !== undefined) parameters.push(date)
		if(currency !== undefined) parameters.push(currency)
		const query = {
			text: `
				SELECT spent_value, spent_currency, gained_value, gained_currency, timestamp
				FROM "Transactions"
				WHERE "user"=$1
			` + (date ? " AND timestamp::date >= $2::date AND timestamp::date < $2::date + interval '1 day'" : "")
			+ (currency ? " AND (spent_currency = $3 OR gained_currency = $3)" : ""),
			values: parameters, 
		}

		const queryResult = await postgresClient.query(query)
		const transactions = queryResult.rowCount > 0 ? queryResult.rows : []
		return {
			transactions: transactions.map(t => ({
				spent:
				{
					value: t.spent_value,
					currency: t.spent_currency,
				},
				gained:
				{
					value: t.gained_value,
					currency: t.gained_currency,
				},
				timestamp: t.timestamp,
			})),
		}
	}
	
	type ServiceImplementation = {
		SignUp: grpc.handleUnaryCall<SignUpData, OperationOutcome>
		Login: grpc.handleUnaryCall<LoginData, LoginResponse>
		Deposit: grpc.handleUnaryCall<DepositData, OperationOutcome>
		Withdraw: grpc.handleUnaryCall<WithdrawData, OperationOutcome>,
		Buy: grpc.handleUnaryCall<BuyData, OperationOutcome>,
		ListTransactions: grpc.handleUnaryCall<TransactionListFilters, TransactionList>,
	}
	
	const implementation: ServiceImplementation = {
		SignUp: async (call, callback) => {
			try
			{
				const signUpResult = await signUpFunction(call.request)
				callback(null, signUpResult)
			}
			catch(error)
			{
				callback({
					code: grpc.status.FAILED_PRECONDITION,
					message: (error as any).toString(),
				})
			}
		},
		Login: async (call, callback) => {
			try
			{
				const signUpResult = await loginFunction(call.request)
				callback(null, signUpResult)
			}
			catch(error)
			{
				callback({
					code: grpc.status.FAILED_PRECONDITION,
					message: (error as any).toString(),
				})
			}
		},
		Deposit: async (call, callback) => {
			try
			{
				const result = await depositFunction(call.request)
				callback(null, result)
			}
			catch(error)
			{
				callback({
					code: grpc.status.FAILED_PRECONDITION,
					message: (error as any).toString(),
				})
			}
		},
		Withdraw: async (call, callback) => {
			try
			{
				const result = await withdrawFunction(call.request)
				callback(null, result)
			}
			catch(error)
			{
				callback({
					code: grpc.status.FAILED_PRECONDITION,
					message: (error as any).toString(),
				})
			}
		},
		Buy: async (call, callback) => {
			try
			{
				const result = await buyFunction(call.request)
				callback(null, result)
			}
			catch(error)
			{
				callback({
					code: grpc.status.FAILED_PRECONDITION,
					message: (error as any).toString(),
				})
			}
		},
		ListTransactions: async (call, callback) =>
		{
			try
			{
				const result = await listTransactionsFunction(call.request)
				callback(null, result)
			}
			catch(error)
			{
				callback({
					code: grpc.status.FAILED_PRECONDITION,
					message: (error as any).toString(),
				})
			}
		},
	}
	
	server.addService(usersService.Users.service, implementation)
	
	server.bindAsync('0.0.0.0:' + (process.env.PORT ?? "9000"), grpc.ServerCredentials.createInsecure(), () => {
		server.start()
	})
})