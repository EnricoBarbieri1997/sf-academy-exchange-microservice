import { Dial } from 'flowbite'
import { Button, Label, Modal, Select, Table, TextInput } from 'flowbite-react'
import { NextPageContext } from 'next'
import React, { useEffect, useState } from 'react'
import { DefaultApi, Transaction } from 'sf-academy-exchanger-sdk'
import { xml2js } from 'xml-js'
import { axiosAuthConfigs, axiosAuthConfigsFromContext } from '../../helpers/authorization'
import { getCookieFromContext } from '../../helpers/cookies'
import { formatCurrency } from '../../helpers/currencies'

type Props = {
	transactions: Transaction[],
	currencies: string[],
}

const currenciesSelectHoc = (currencies: string[]) =>
{
	return function({id,name, className}: any)
	{
		return (
			<Select id={id} name={name ?? "currency"} className={className}>
				{currencies.map(c => <option>{c}</option>)}
			</Select>
		)
	}
}

export default function Transactions({transactions, currencies}: Props) {
	const [showBuy, setShowBuy] = useState(false)
	const [showDeposit, setShowDeposit] = useState(false)
	const [showWithdraw, setShowWithdraw] = useState(false)
	const [hydrated, setHydrated] = useState(false)

	const CurrenciesSelect = currenciesSelectHoc(currencies)

	useEffect(() =>
	{
		setHydrated(true)
	}, [])
	

  return (
		<>
			<div className="container flex flex-col h-screen py-8">
				<h1 className='text-4xl mb-8'>History</h1>
				<div className="grow mb-2 overflow-auto">
					<Table className='text-right'>
						<Table.Head>
							<Table.HeadCell>Gained</Table.HeadCell>
							<Table.HeadCell>Spent</Table.HeadCell>
							<Table.HeadCell>Date</Table.HeadCell>
						</Table.Head>
						<Table.Body>
							{
								transactions.map(t =>
									<Table.Row key={t.timestamp}>
										<Table.Cell className='w-max'>
											{t.gained && t.gained.value && t.gained.currency && formatCurrency(t.gained?.value, t.gained?.currency)}
										</Table.Cell>
										<Table.Cell>
										{t.spent && t.spent.value && t.spent.currency && formatCurrency(t.spent?.value, t.spent?.currency)}
										</Table.Cell>
										<Table.Cell>{hydrated && t.timestamp && (new Date(t.timestamp)).toLocaleString()}</Table.Cell>
									</Table.Row>)
							}
						</Table.Body>
					</Table>
				</div>
				<Button.Group className='self-end'>
					<Button color="gray" onClick={() => setShowDeposit(true)}>
						Deposit
					</Button>
					<Button color="gray" onClick={() => setShowWithdraw(true)}>
						Withdraw
					</Button>
					<Button color="gray" onClick={() => setShowBuy(true)}>
						Buy
					</Button>
				</Button.Group>
			</div>
			<Modal show={showBuy} onClose={() => setShowBuy(false)}>
				<Modal.Header>
					Buy
				</Modal.Header>
				<Modal.Body>
					<form action='/api/buy' method='POST' className='gap-2 grid'>
						<TextInput name='value' type="number" min={0.01} defaultValue={0.01} step={0.01}></TextInput>
						<div className="grid gap-2 grid-cols-4 items-center">
							<Label htmlFor='bg'>From</Label>
							<CurrenciesSelect className="col-span-3" id="bf" name="from"></CurrenciesSelect>
							<Label htmlFor='bt'>To</Label>
							<CurrenciesSelect className="col-span-3" id="bt" name="to"></CurrenciesSelect>
						</div>
						<Button type='submit'>Buy</Button>
					</form>
				</Modal.Body>
			</Modal>
			<Modal show={showDeposit} onClose={() => setShowDeposit(false)}>
				<Modal.Header>
					Deposit
				</Modal.Header>
				<Modal.Body>
					<form action='/api/deposit' method='POST' className='gap-2 grid'>
						<TextInput name='value' type="number" min={0.01} defaultValue={0.01} step={0.01}></TextInput>
						<CurrenciesSelect></CurrenciesSelect>
						<Button type='submit'>Deposit</Button>
					</form>
				</Modal.Body>
			</Modal>
			<Modal show={showWithdraw} onClose={() => setShowWithdraw(false)}>
				<Modal.Header>
					Withdraw
				</Modal.Header>
				<Modal.Body>
					<form action='/api/withdraw' method='POST' className='gap-2 grid'>
						<TextInput name='value' type="number" min={0.01} defaultValue={0.01} step={0.01}></TextInput>
						<CurrenciesSelect></CurrenciesSelect>
						<Button type='submit'>Withdraw</Button>
					</form>
				</Modal.Body>
			</Modal>
		</>
  )
}

export async function getServerSideProps(context: NextPageContext)
{
	const currencies: string[] = ["EUR"]
	const transactions: Transaction[] = []
	if(process.env.EUROPE_BANK_EXCHANGE_URL)
	{
		try
		{
			const data = await (await fetch(process.env.EUROPE_BANK_EXCHANGE_URL, {
				cache: "force-cache",
			})).text()
			const currencyiesTree = xml2js(data)
			currencyiesTree.elements[0]
			.elements[2]
			.elements[0].
			elements
			.map((e: any) => e.attributes)
			.map((e: any) => e.currency)
			.forEach((e: any) => currencies.push(e))
		}
		catch(e)
		{
			console.log(e)
		}
	}

	const api = new DefaultApi()
	try
	{
		(await api.listTransactionsLogged(axiosAuthConfigsFromContext(context))).data.forEach(t => transactions.push(t))
	}
	catch(e)
	{
	}

	return {
		props: {
			transactions,
			currencies,
		},
	}
}