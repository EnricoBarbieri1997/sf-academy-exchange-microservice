import { NextApiRequest, NextPageContext } from "next";
import { getCookieFromContext, getCookieFromReq } from "./cookies";

export function getTokenFromReq(req: NextApiRequest)
{
	return getCookieFromReq(req, "token")
}

export function getTokenFromContext(req: NextPageContext)
{
	return getCookieFromContext(req, "token")
}

export function axiosAuthConfigs(req: NextApiRequest)
{
	return {
		headers: { Authorization: `Bearer ${getTokenFromReq(req)}` }
	}
}

export function axiosAuthConfigsFromContext(context: NextPageContext)
{
	return {
		headers: { Authorization: `Bearer ${getTokenFromContext(context)}` }
	}
}