import { Button, TextInput } from "flowbite-react"
import React from "react"
import CenteredContent from "../../components/CenteredContent"

export default function Login() {
  return (
	<CenteredContent>
		<h1 className="text-4xl mb-4">Login</h1>
		<form action="/api/login" method="POST">
			<TextInput name="email" className="mb-2" placeholder="Username"></TextInput>
			<TextInput name="password" type="password" placeholder="Password" className="mb-2"></TextInput>
			<Button type="submit" fullSized>Login</Button>
		</form>
	</CenteredContent>
  )
}
