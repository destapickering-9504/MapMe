import React, { useState } from 'react'
import { Auth } from 'aws-amplify'

export default function SignUp() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [phase, setPhase] = useState('signup')

  const doSignUp = async () => {
    await Auth.signUp({ username: email, password, attributes: { email } })
    setPhase('confirm')
  }
  const doConfirm = async () => {
    await Auth.confirmSignUp(email, code)
    window.location.assign('/signin')
  }
  return (
    <div>
      <h2>Create account</h2>
      {phase === 'signup' ? (
        <div>
          <input placeholder="email" value={email} onChange={e=>setEmail(e.target.value)} />
          <input placeholder="password" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
          <button onClick={doSignUp}>Sign up</button>
        </div>
      ) : (
        <div>
          <input placeholder="code" value={code} onChange={e=>setCode(e.target.value)} />
          <button onClick={doConfirm}>Confirm</button>
        </div>
      )}
    </div>
  )
}