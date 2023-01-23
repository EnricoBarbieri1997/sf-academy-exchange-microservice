import { NextApiRequest, NextPageContext } from "next"

export function getCookie(cookies: string, name: string)
{
	const keyIndex = cookies.indexOf(name)
	if(keyIndex < 0) return ""
	const valueStart = cookies.indexOf("=", keyIndex) + 1
	const valueEnd = cookies.indexOf(";", valueStart)
	return cookies.substring(valueStart, valueEnd >= 0 ? valueEnd : cookies.length)
}

export function getCookieFromContext(context: NextPageContext, name: string)
{
	return context.req && context.req.headers.cookie ? getCookie(context.req.headers.cookie, name) : ""
}

export function getCookieFromReq(req: NextApiRequest, name: string)
{
	return req.cookies[name]?.trimEnd()
}