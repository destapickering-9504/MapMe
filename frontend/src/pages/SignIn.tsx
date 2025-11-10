import { signInWithRedirect } from 'aws-amplify/auth'

export default function SignIn(): JSX.Element {
  const hosted = (): void => {
    // Send user to Hosted UI (supports Google/Facebook/Apple)
    signInWithRedirect()
  }

  return (
    <div>
      <h2>Sign in to MapMe</h2>
      <p>Use Hosted UI (supports social providers)</p>
      <button onClick={hosted}>Continue</button>
    </div>
  )
}
