import { Handler } from "express"
import { UsersClient } from "../../../../gRPC/Typescript/exchange/Users"

export const GET: Handler = function (req, res)
{
	const jwtPayload = res.locals.jwtPayload as {
		user: number
	}
	if(jwtPayload === undefined)
	{
		res.status(500).json(false)
		return
	}
	const user = jwtPayload.user
	const users = res.locals.usersClient as UsersClient
	if(user === undefined)
	{
		res.status(500).json(false)
		return
	}
	users.ListTransactions({
		user,
	}, (err, response) =>
	{
		if(response)
		{
			res.status(200).json(response.transactions)
		}
		else
		{
			res.status(500).json(false)
		}
	})
}