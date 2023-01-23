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
	const body = req.body
	const data = {
		from: {
			value: parseFloat(body.value),
			currency: body.from,
		},
		to: body.to,
	}
	const api = new DefaultApi()
	try
	{
		await api.buy(data, axiosAuthConfigs(req))
	}
	finally
	{
		res.redirect("/transactions")
	}
}
