import { env } from "process"
import { Handler } from "express"
import { UsersClient } from "../../../gRPC/Typescript/exchange/Users"
import jwt from "jsonwebtoken"

export const parameters = []

export const POST: Handler = async function (req, res)
{
	const users = res.locals.usersClient as UsersClient
	if(env.JWT_SECRET === undefined)
	{
		res.status(500).json({
			message: "JWT secret missing"
		})
		return
	}
	const secret = env.JWT_SECRET
	try
	{
		users.Login(req.body, (err, result) =>
		{
			if(err) throw err
			if(result?.id)
			{
				res.status(200).json(jwt.sign({
					user: result.id,
				}, secret))
				return
			}
		})
	}
	catch(e)
	{
		res.status(400).json(e)
	}
}