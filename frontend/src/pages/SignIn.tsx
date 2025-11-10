import React from 'react'
import { Auth } from 'aws-amplify'
import { cfg } from '../aws-config'

Auth.configure({
  region: cfg.region,
  userPoolId: cfg.userPoolId,
  userPoolWebClientId: cfg.userPoolClientId,
  oauth: {
    domain: `${cfg.userPoolId}.auth.${cfg.region}.amazoncognito.com`,
    scope: ['email', 'openid', 'profile'],
    redirectSignIn: window.location.origin + '/onboarding',
    redirectSignOut: window.location.origin + '/signin',
    responseType: 'code',
  },
})

export default function SignIn(): JSX.Element {
  const hosted = (): void => {
    // Send user to Hosted UI (supports Google/Facebook/Apple)
    Auth.federatedSignIn()
  }
  
  return (
    <div>
      <h2>Sign in to MapMe</h2>
      <p>Use Hosted UI (supports social providers)</p>
      <button onClick={hosted}>Continue</button>
    </div>
  )
}
