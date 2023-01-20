import { Handler } from "express"
import { UsersClient } from "../../../gRPC/Typescript/exchange/Users"
import { Amount } from "../../../gRPC/Typescript/exchange/Amount"

export const POST: Handler = function (req, res)
{
	const {from, to} = req.body as {from: Amount, to: string}
	const users = res.locals.usersClient as UsersClient
	const jwtPayload = res.locals.jwtPayload as {
		user: number
	}
	if(jwtPayload === undefined)
	{
		res.status(500).json(false)
		return
	}
	users.Buy({
		user: jwtPayload.user,
		from,
		to
	}, (err, response) =>
	{
		if(response && response.success)
		{
			res.status(200).json(true)
		}
		else
		{
			res.status(500).json(false)
		}
	})
}