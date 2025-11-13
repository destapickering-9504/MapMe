import { useState, ChangeEvent } from 'react'
import { signUp, confirmSignUp } from 'aws-amplify/auth'
import { Link } from 'react-router-dom'

type Phase = 'signup' | 'confirm'

export default function SignUp(): JSX.Element {
  const [email, setEmail] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [code, setCode] = useState<string>('')
  const [phase, setPhase] = useState<Phase>('signup')

  const doSignUp = async (): Promise<void> => {
    await signUp({ username: email, password, options: { userAttributes: { email } } })
    setPhase('confirm')
  }

  const doConfirm = async (): Promise<void> => {
    await confirmSignUp({ username: email, confirmationCode: code })
    window.location.assign('/signin')
  }

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-8 col-lg-6">
            <div className="card shadow-lg border-0">
              <div className="card-body p-5">
                <div className="text-center mb-4">
                  <h1 className="display-4 fw-bold text-primary mb-3">MapMe</h1>
                  {phase === 'signup' ? (
                    <>
                      <h2 className="h4 text-secondary mb-2">Create Account</h2>
                      <p className="text-muted">Join MapMe and find the services you need</p>
                    </>
                  ) : (
                    <>
                      <h2 className="h4 text-secondary mb-2">Verify Your Email</h2>
                      <p className="text-muted">Enter the confirmation code sent to your email</p>
                    </>
                  )}
                </div>

                {phase === 'signup' ? (
                  <div>
                    <div className="mb-3">
                      <label htmlFor="email" className="form-label">
                        Email address
                      </label>
                      <input
                        id="email"
                        type="email"
                        className="form-control form-control-lg"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                      />
                    </div>
                    <div className="mb-4">
                      <label htmlFor="password" className="form-label">
                        Password
                      </label>
                      <input
                        id="password"
                        type="password"
                        className="form-control form-control-lg"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                          setPassword(e.target.value)
                        }
                      />
                    </div>
                    <div className="d-grid gap-2">
                      <button onClick={doSignUp} className="btn btn-primary btn-lg">
                        Sign Up
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="mb-4">
                      <label htmlFor="code" className="form-label">
                        Confirmation Code
                      </label>
                      <input
                        id="code"
                        type="text"
                        className="form-control form-control-lg"
                        placeholder="Enter confirmation code"
                        value={code}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setCode(e.target.value)}
                      />
                    </div>
                    <div className="d-grid gap-2">
                      <button onClick={doConfirm} className="btn btn-primary btn-lg">
                        Confirm
                      </button>
                    </div>
                  </div>
                )}

                <div className="mt-4 text-center">
                  <small className="text-muted">
                    Already have an account?{' '}
                    <Link to="/signin" className="text-primary text-decoration-none">
                      Sign In
                    </Link>
                  </small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
