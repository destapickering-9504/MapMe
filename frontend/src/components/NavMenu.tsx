import { signOut } from 'aws-amplify/auth'
import { useNavigate } from 'react-router-dom'

export default function NavMenu(): JSX.Element {
  const navigate = useNavigate()

  const handleSignOut = async (): Promise<void> => {
    try {
      await signOut()
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
        <button onClick={handleSignOut}>Sign out</button>
      </div>
    </div>
  )
}
