import * as grpc from '@grpc/grpc-js'
import * as protoLoader from '@grpc/proto-loader'
import { join } from "path"
import { env } from "process"
import * as https from "https"
import { xml2js } from 'xml-js'
import { ExchangeData } from "./gRPC/Typescript/exchange/ExchangeData"
import { ExchangeResult } from "./gRPC/Typescript/exchange/ExchangeResult"

if (env.EUROPE_BANK_EXCHANGE_URL === undefined) throw "Missing europe bank data url"
const europeBankUrl = env.EUROPE_BANK_EXCHANGE_URL

if (env.PROTO_PATH === undefined) throw "Proto path missing"
const packageDefinition = protoLoader.loadSync(join(__dirname, env.PROTO_PATH, "exchange.proto"))
const protoDescriptor = grpc.loadPackageDefinition(packageDefinition)

const exchangeService = protoDescriptor.exchange as any
const server = new grpc.Server()

async function exchangeFunction({ value, from, to }: ExchangeData): Promise<ExchangeResult> {
	if(from === undefined) throw "Missing from paramter"
	if(to === undefined) throw "Missing to paramter"
	if(value === undefined) throw "Missing value paramter"

	const exchangeRates = new Map<string, number>(xml2js(await (new Promise((resolve, reject) => {
		let document = ""
		https.get(europeBankUrl, res => {
			res.on("data", data => document += data)
			res.on("end", () => resolve(document))
			res.on("error", e => reject(e))
		})
	}))).elements[0]
		.elements[2]
		.elements[0].
		elements
		.map((e: any) => e.attributes)
		.map((e: any) => [e.currency, parseFloat(e.rate)])
	)
	exchangeRates.set("EUR", 1)
	if(!exchangeRates.has(from)) throw "From currency missing from dataset"
	if(!exchangeRates.has(to)) throw "To currency missing from dataset"
	const fromRate = exchangeRates.get(from) as number
	const toRate = exchangeRates.get(to) as number
	return {
		value: (typeof value === "string" ? parseFloat(value) : value) * fromRate / toRate,
	}
}

type ServiceImplementation = {
	Exchange: grpc.handleUnaryCall<ExchangeData, ExchangeResult>
}

const implementation: ServiceImplementation = {
	Exchange: async (call, callback) => {
		try
		{
			const exchangeRate = await exchangeFunction(call.request)
			callback(null, exchangeRate)
		}
		catch(error)
		{
			callback({
				code: grpc.status.FAILED_PRECONDITION,
			})
		}
	}
}

server.addService(exchangeService.Exchange.service, implementation)

server.bindAsync('0.0.0.0:' + (env.PORT ?? "9000"), grpc.ServerCredentials.createInsecure(), () => {
	server.start()
})