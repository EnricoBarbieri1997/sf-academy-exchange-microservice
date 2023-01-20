import { Handler } from "express"
import { UsersClient } from "../../../gRPC/Typescript/exchange/Users"
import { Amount } from "../../../gRPC/Typescript/exchange/Amount"

export const POST: Handler = function (req, res)
{
	const amount = req.body as Amount
	const users = res.locals.usersClient as UsersClient
	const jwtPayload = res.locals.jwtPayload as {
		user: number
	}
	if(jwtPayload === undefined)
	{
		res.status(500).json(false)
		return
	}
	users.Deposit({
		user: jwtPayload.user,
		amount,
	}, (err, response) =>
	{
		if(response)
		{
			res.status(200).json(true)
		}
		else
		{
			res.status(500).json(false)
		}
	})
}