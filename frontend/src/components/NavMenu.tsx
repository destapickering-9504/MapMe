import React from 'react'
import { Auth } from 'aws-amplify'
import { useNavigate } from 'react-router-dom'

export default function NavMenu(): JSX.Element {
  const navigate = useNavigate()
  
  const signOut = async (): Promise<void> => {
    try {
      await Auth.signOut()
    } finally {
      navigate('/signin')
    }
  }
  
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'flex-end',
        padding: 16,
        borderBottom: '1px solid #eee',
      }}
    >
      <div style={{ position: 'relative' }}>
        <button onClick={signOut}>Sign out</button>
      </div>
    </div>
  )
}
