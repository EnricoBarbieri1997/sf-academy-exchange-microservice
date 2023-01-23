import { Button, TextInput } from "flowbite-react"
import React from "react"
import CenteredContent from "../../components/CenteredContent"

export default function Signup() {
  return (
	<CenteredContent>
		<h1 className="text-4xl mb-4">Sign up</h1>
		<form action="/api/signup" method="POST" className="grid grid-cols-2 gap-2">
			<TextInput name="email" placeholder="Username"></TextInput>
			<TextInput name="password" type="password" placeholder="Password" ></TextInput>
			<TextInput name="name" placeholder="Name"></TextInput>
			<TextInput name="iban" placeholder="Iban"></TextInput>
			<Button type="submit" fullSized>Signup</Button>
		</form>
	</CenteredContent>
  )
}
