import type { NextApiRequest, NextApiResponse } from 'next'
import {DefaultApi} from "sf-academy-exchanger-sdk"
import { axiosAuthConfigs } from '../../helpers/authorization'
import { getCookie, getCookieFromReq } from '../../helpers/cookies'

type Data = boolean

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
)
{
	const data = req.body
	data.value = parseFloat(data.value)
	const api = new DefaultApi()
	try
	{
		await api.withdraw(data, axiosAuthConfigs(req))
	}
	finally
	{
		res.redirect("/transactions")
	}
}
