import React, { PropsWithChildren } from 'react'

export default function CenteredContent({children}: PropsWithChildren) {
  return (
	<div className="h-screen w-screen flex justify-center items-center">
		<div>
			{children}
		</div>
	</div>
  )
}
