import { Handler } from "express"
import { UsersClient } from "../../../gRPC/Typescript/exchange/Users"

export const parameters = []

export const POST: Handler = async function (req, res)
{
	const users = res.locals.usersClient as UsersClient
	const {email, password, name, iban} = req.body
	try
	{
		users.SignUp({
			login: {
				email,
				password
			},
			user: {
				name,
				iban
			}
		}, (err, result) =>
		{
			if(err) throw err
			if(result?.success)
			{
				res.status(200).json(true)
				return
			}
		})
	}
	catch(e)
	{
		res.status(400).json(e)
	}
}