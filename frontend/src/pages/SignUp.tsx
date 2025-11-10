import React, { useState, ChangeEvent } from 'react'
import { Auth } from 'aws-amplify'

type Phase = 'signup' | 'confirm'

export default function SignUp(): JSX.Element {
  const [email, setEmail] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [code, setCode] = useState<string>('')
  const [phase, setPhase] = useState<Phase>('signup')

  const doSignUp = async (): Promise<void> => {
    await Auth.signUp({ username: email, password, attributes: { email } })
    setPhase('confirm')
  }

  const doConfirm = async (): Promise<void> => {
    await Auth.confirmSignUp(email, code)
    window.location.assign('/signin')
  }

  return (
    <div>
      <h2>Create account</h2>
      {phase === 'signup' ? (
        <div>
          <input
            placeholder="email"
            value={email}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
          />
          <input
            placeholder="password"
            type="password"
            value={password}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
          />
          <button onClick={doSignUp}>Sign up</button>
        </div>
      ) : (
        <div>
          <input
            placeholder="code"
            value={code}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setCode(e.target.value)}
          />
          <button onClick={doConfirm}>Confirm</button>
        </div>
      )}
    </div>
  )
}
