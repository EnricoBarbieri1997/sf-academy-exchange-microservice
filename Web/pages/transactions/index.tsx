import { Table } from 'flowbite-react'
import { NextPageContext } from 'next'
import React from 'react'
import { DefaultApi, Transaction } from 'sf-academy-exchanger-sdk'
import { getCookieFromContext } from '../../helpers/cookies'

type Props = {
	transactions: Transaction[]
}

export default function Transactions({transactions}: Props) {
  return (
	<>
		<h1 className='text-4xl mb-8'>History</h1>
		<Table>
			<Table.Head>
				<Table.HeadCell>Gained</Table.HeadCell>
				<Table.HeadCell>Spent</Table.HeadCell>
				<Table.HeadCell>Date</Table.HeadCell>
			</Table.Head>
			<Table.Body>
				{
					transactions.map(t =>
						<Table.Row key={t.timestamp}>
							<Table.Cell>
								{(t.gained?.value ?? 0) + (t.gained?.currency ?? "")}
							</Table.Cell>
							<Table.Cell>
								{(t.spent?.value ?? 0) + (t.spent?.currency ?? "")}
							</Table.Cell>
							<Table.Cell>{t.timestamp}</Table.Cell>
						</Table.Row>)
				}
			</Table.Body>
		</Table>
	</>
  )
}

export async function getServerSideProps(context: NextPageContext)
{
	const token = getCookieFromContext(context, "token")
	const api = new DefaultApi()
	try
	{
		const transactions = (await api.listTransactionsLogged({
			headers: { Authorization: `Bearer ${token}` }
		})).data
		console.log("T", typeof transactions, transactions)
		return {
			props: {
				transactions,
			},
		}
	}
	catch(e)
	{
		console.log(e)
		return {
			props: {
				transactions: [],
			},
		}
	}
}