import type { NextApiRequest, NextApiResponse } from 'next'
import {DefaultApi, Login} from "sf-academy-exchanger-sdk"

type Data = boolean

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
)
{
	const data = req.body
	const api = new DefaultApi()
	const result = await api.login(data)
	try
	{
		if(result.data)
		{
			res.setHeader("Set-Cookie", "token=" + result.data + "; Path=/; HttpOnly; Secure;")
			res.status(200)
			res.redirect("/transactions")
			res.end()
			return
		}
	}
	catch(e)
	{
		console.log(e)
	}
	res.status(500).json(false)
}
