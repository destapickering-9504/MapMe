import React from 'react'
import AvatarUpload from '../components/AvatarUpload'
import { useNavigate } from 'react-router-dom'

export default function Onboarding(): JSX.Element {
  const navigate = useNavigate()
  
  return (
    <div>
      <h2>Welcome! Onboarding</h2>
      <p>You can skip anything for now.</p>
      <h3>Upload an avatar</h3>
      <AvatarUpload />
      <div style={{ marginTop: 16 }}>
        <button onClick={() => navigate('/home')}>Continue</button>
        <button onClick={() => navigate('/home')} style={{ marginLeft: 8 }}>
          Skip
        </button>
      </div>
    </div>
  )
}
