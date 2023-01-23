import type { NextApiRequest, NextApiResponse } from 'next'
import {DefaultApi, Login} from "sf-academy-exchanger-sdk"

type Data = boolean

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
)
{
	const api = new DefaultApi()
	try
	{
		const result = await api.signUp(req.body)
		if(result.data) res.status(200).redirect("/login")
		return
	}
	catch(e)
	{
		console.log(e)
	}
	res.status(500).json(false)
}
