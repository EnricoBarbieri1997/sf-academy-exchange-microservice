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

const hashIterations = 10000
const pbkdf2 = promisify(callbackPbkdf2)

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
				token: "test",
			}
		}
		catch(e)
		{
			throw "Invalid query " + e
		}

		throw "Generic error"
	}
	
	type ServiceImplementation = {
		SignUp: grpc.handleUnaryCall<SignUpData, OperationOutcome>
		Login: grpc.handleUnaryCall<LoginData, LoginResponse>
	}
	
	const SignUp: grpc.handleUnaryCall<SignUpData, OperationOutcome> = async (call, callback) => {
		try
		{
			const signUpResult = await signUpFunction(call.request)
			callback(null, signUpResult)
		}
		catch(error)
		{
			callback({
				code: grpc.status.FAILED_PRECONDITION,
			})
		}
	}
	const Login: grpc.handleUnaryCall<LoginData, LoginResponse> = async (call, callback) => {
		try
		{
			const signUpResult = await loginFunction(call.request)
			callback(null, signUpResult)
		}
		catch(error)
		{
			callback({
				code: grpc.status.FAILED_PRECONDITION,
			})
		}
	}
	
	const implementation: ServiceImplementation = {
		SignUp,
		Login,
	}
	
	server.addService(usersService.Users.service, implementation)
	
	server.bindAsync('0.0.0.0:' + (process.env.PORT ?? "9000"), grpc.ServerCredentials.createInsecure(), () => {
		server.start()
	})
})