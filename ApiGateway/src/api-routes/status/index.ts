import { Handler } from "express"
export const parameters = []

export const GET:Handler  = function(req, res)
{
	res.status(200).json({
		status: "ok",
	})
}