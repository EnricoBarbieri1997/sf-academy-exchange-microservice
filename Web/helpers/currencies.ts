export function formatCurrency(value: number, currency: string)
{
	return new Intl.NumberFormat(`en-US`, {
		currency: currency,
		style: 'currency',
	}).format(value)
}