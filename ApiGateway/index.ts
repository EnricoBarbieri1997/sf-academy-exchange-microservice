import {env} from "process"
import express from "express"
import { readFileSync } from "fs"
import {initialize} from "express-openapi"
import { resolve as resolvePath, join as joinPath} from "path"
import cors from "cors"
import jwt, { Jwt } from "jsonwebtoken"
import * as grpc from '@grpc/grpc-js'
import * as protoLoader from '@grpc/proto-loader'

import {GET as status} from "./src/api-routes/status"
import {POST as login} from "./src/api-routes/login"
import {POST as signUp} from "./src/api-routes/sign-up"
import {POST as deposit} from "./src/api-routes/deposit"
import {POST as withdraw} from "./src/api-routes/withdraw"
import {POST as buy} from "./src/api-routes/buy"
import {GET as listTransactions} from "./src/api-routes/transactions/list/{id}"

const app = express()

app.use(cors())
app.use(express.json())

app.use(function(req, res, next)
{
	if(env.PROTO_PATH === undefined) throw "Proto path missing"
	const usersPackageDefinition = protoLoader.loadSync(joinPath(__dirname, env.PROTO_PATH, "users.proto"))
	const usersProtoDescriptor = grpc.loadPackageDefinition(usersPackageDefinition)
	const usersService = usersProtoDescriptor.exchange as any
	res.locals.usersClient = new usersService.Users('users:9001', grpc.credentials.createInsecure())
	next()
})

app.use(function(req, res, next)
{
	const headers = req.headers as any
	if(headers !== undefined)
	{
		try
		{
			const authHeader = headers.authorization
			const token = authHeader && authHeader.split(' ')[1]
			res.locals.jwtPayload = jwt.verify(token, env.JWT_SECRET as string)
		}
		catch(e)
		{
			// console.log(e)
		}
	}
	next()
})

initialize({
	apiDoc: readFileSync(resolvePath(__dirname, 'src', 'api-doc.yml'), 'utf8'),
	app,
	securityHandlers: {
		Token: function(req, scopes, definition)
		{
			const headers = req.headers as any
			if(req.headers === undefined) return false
			const authHeader = headers.authorization
			const token = authHeader && authHeader.split(' ')[1]

			if (token == null) return false

			try
			{
				const payload = jwt.verify(token, env.JWT_SECRET as string) as jwt.JwtPayload
				if(payload.user === undefined) return false
			}
			catch(e)
			{
				return false
			}
			return true
		}
	},
	operations: {
		status,
		login,
		signUp,
		deposit,
		withdraw,
		buy,
		listTransactions,
	}
})

app.use(function (err, req, res, next)
{
	res.status(err.status).json(err)
} as express.ErrorRequestHandler)

app.listen(process.env.PORT ?? 8080)