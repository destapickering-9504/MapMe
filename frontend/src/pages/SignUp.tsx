import { useState, ChangeEvent, useEffect, useRef } from 'react'
import { signUp, confirmSignUp, resendSignUpCode, signIn } from 'aws-amplify/auth'
import { Link, useNavigate } from 'react-router-dom'

type Phase = 'signup' | 'confirm'

interface ValidationErrors {
  email?: string
  password?: string
  confirmPassword?: string
  code?: string
}

interface PasswordRequirements {
  minLength: boolean
  hasUppercase: boolean
  hasLowercase: boolean
  hasNumber: boolean
  hasSpecialChar: boolean
}

export default function SignUp(): JSX.Element {
  const [email, setEmail] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [confirmPassword, setConfirmPassword] = useState<string>('')
  const [code, setCode] = useState<string>('')
  const [phase, setPhase] = useState<Phase>('signup')
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState<string>('')
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({})
  const [resendCountdown, setResendCountdown] = useState<number>(0)
  const [passwordRequirements, setPasswordRequirements] = useState<PasswordRequirements>({
    minLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false,
    hasSpecialChar: false,
  })
  const [showRequirements, setShowRequirements] = useState<boolean>(false)
  const [showPassword, setShowPassword] = useState<boolean>(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false)
  const codeInputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  // Countdown timer for resend code
  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [resendCountdown])

  // Auto-focus on code input when entering confirm phase
  useEffect(() => {
    if (phase === 'confirm' && codeInputRef.current) {
      codeInputRef.current.focus()
    }
  }, [phase])

  // Update password requirements as user types
  useEffect(() => {
    if (password) {
      setPasswordRequirements({
        minLength: password.length >= 8,
        hasUppercase: /[A-Z]/.test(password),
        hasLowercase: /[a-z]/.test(password),
        hasNumber: /[0-9]/.test(password),
        hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
      })
    }
  }, [password])

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const validatePassword = (password: string): PasswordRequirements => {
    return {
      minLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
    }
  }

  const isPasswordValid = (requirements: PasswordRequirements): boolean => {
    return Object.values(requirements).every((req) => req === true)
  }

  const validateForm = (): boolean => {
    const errors: ValidationErrors = {}

    if (!email) {
      errors.email = 'Email is required'
    } else if (!validateEmail(email)) {
      errors.email = 'Please enter a valid email address'
    }

    if (!password) {
      errors.password = 'Password is required'
    } else {
      const requirements = validatePassword(password)
      if (!isPasswordValid(requirements)) {
        errors.password = 'Password does not meet all requirements'
      }
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'Please confirm your password'
    } else if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match'
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const doSignUp = async (): Promise<void> => {
    setError('')
    setSuccess('')
    setValidationErrors({})

    if (!validateForm()) {
      return
    }

    setLoading(true)
    try {
      await signUp({
        username: email,
        password,
        options: { userAttributes: { email } },
      })
      setPhase('confirm')
      setSuccess('Verification code sent to your email!')
      setResendCountdown(60) // Start 60 second countdown
    } catch (err: unknown) {
      if (err instanceof Error) {
        if (err.message.includes('User already exists')) {
          setError('An account with this email already exists. Please sign in.')
        } else if (err.message.includes('Password')) {
          setError(
            'Password must meet all requirements: 8+ characters with uppercase, lowercase, number, and special character.'
          )
        } else {
          setError(err.message || 'Failed to sign up. Please try again.')
        }
      } else {
        setError('Failed to sign up. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const doConfirm = async (): Promise<void> => {
    setError('')
    setSuccess('')

    if (!code) {
      setValidationErrors({ code: 'Confirmation code is required' })
      return
    }

    setLoading(true)
    try {
      // Confirm the email
      await confirmSignUp({ username: email, confirmationCode: code })
      
      // Automatically sign in the user
      await signIn({ username: email, password })
      
      setSuccess('Email verified successfully! Taking you to onboarding...')
      setTimeout(() => {
        navigate('/onboarding')
      }, 2000)
    } catch (err: unknown) {
      if (err instanceof Error) {
        if (err.message.includes('Invalid') || err.message.includes('Code')) {
          setError('Invalid confirmation code. Please check and try again.')
        } else if (err.message.includes('expired')) {
          setError('Confirmation code has expired. Please request a new code.')
        } else {
          setError(err.message || 'Failed to confirm. Please try again.')
        }
      } else {
        setError('Failed to confirm. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const doResendCode = async (): Promise<void> => {
    if (resendCountdown > 0) return

    setError('')
    setSuccess('')
    setLoading(true)

    try {
      await resendSignUpCode({ username: email })
      setSuccess('A new verification code has been sent to your email!')
      setResendCountdown(60) // Restart countdown
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || 'Failed to resend code. Please try again.')
      } else {
        setError('Failed to resend code. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const changeEmail = (): void => {
    setPhase('signup')
    setCode('')
    setError('')
    setSuccess('')
    setValidationErrors({})
  }

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-8 col-lg-6">
            <div className="card shadow-lg border-0">
              <div className="card-body p-5">
                <div className="text-center mb-4">
                  <div className="d-flex align-items-center justify-content-center mb-3">
                    <h1 className="display-4 fw-bold text-primary mb-0 me-3">MapMe</h1>
                    <img 
                      src="/MapMeLogo.png" 
                      alt="MapMe Logo" 
                      style={{ width: '60px', height: 'auto' }}
                    />
                  </div>
                  {phase === 'signup' ? (
                    <>
                      <h2 className="h4 text-secondary mb-2">Create Account</h2>
                      <p className="text-muted">Join MapMe! MapMe is a location-based discovery and personalization platform designed to help users find places, experiences, and services near them, while learning from their preferences over time.</p>
                    </>
                  ) : (
                    <>
                      <h2 className="h4 text-secondary mb-2">Verify Your Email</h2>
                      <p className="text-muted">
                        We sent a confirmation code to <strong>{email}</strong>
                      </p>
                    </>
                  )}
                </div>

                {/* Success Alert */}
                {success && (
                  <div className="alert alert-success" role="alert">
                    {success}
                  </div>
                )}

                {/* Error Alert */}
                {error && (
                  <div className="alert alert-danger" role="alert">
                    {error}
                  </div>
                )}

                {phase === 'signup' ? (
                  <div>
                    <div className="mb-3">
                      <label htmlFor="email" className="form-label">
                        Email address
                      </label>
                      <input
                        id="email"
                        type="email"
                        className={`form-control form-control-lg ${
                          validationErrors.email ? 'is-invalid' : ''
                        }`}
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => {
                          setEmail(e.target.value)
                          setValidationErrors({ ...validationErrors, email: undefined })
                        }}
                        disabled={loading}
                      />
                      {validationErrors.email && (
                        <div className="invalid-feedback">{validationErrors.email}</div>
                      )}
                    </div>

                    <div className="mb-3">
                      <label htmlFor="password" className="form-label">
                        Password
                      </label>
                      <div className="input-group">
                        <input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          className={`form-control form-control-lg ${
                            validationErrors.password ? 'is-invalid' : ''
                          }`}
                          placeholder="Enter your password"
                          value={password}
                          onChange={(e: ChangeEvent<HTMLInputElement>) => {
                            setPassword(e.target.value)
                            setValidationErrors({ ...validationErrors, password: undefined })
                            setShowRequirements(true)
                          }}
                          onFocus={() => setShowRequirements(true)}
                          disabled={loading}
                        />
                        <button
                          className="btn btn-outline-secondary"
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          disabled={loading}
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? (
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C97D60" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                              <line x1="1" y1="1" x2="23" y2="23"/>
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C97D60" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                              <circle cx="12" cy="12" r="3"/>
                            </svg>
                          )}
                        </button>
                        {validationErrors.password && (
                          <div className="invalid-feedback">{validationErrors.password}</div>
                        )}
                      </div>

                      {/* Password Requirements Checklist */}
                      {showRequirements && password && (
                        <div className="mt-2 p-3 bg-light rounded">
                          <small className="text-muted d-block mb-2 fw-bold">
                            Password Requirements:
                          </small>
                          <div className="d-flex flex-column gap-1">
                            <small
                              className={
                                passwordRequirements.minLength ? 'text-success' : 'text-danger'
                              }
                            >
                              {passwordRequirements.minLength ? '✓' : '✗'} At least 8 characters
                            </small>
                            <small
                              className={
                                passwordRequirements.hasUppercase ? 'text-success' : 'text-danger'
                              }
                            >
                              {passwordRequirements.hasUppercase ? '✓' : '✗'} One uppercase letter
                              (A-Z)
                            </small>
                            <small
                              className={
                                passwordRequirements.hasLowercase ? 'text-success' : 'text-danger'
                              }
                            >
                              {passwordRequirements.hasLowercase ? '✓' : '✗'} One lowercase letter
                              (a-z)
                            </small>
                            <small
                              className={
                                passwordRequirements.hasNumber ? 'text-success' : 'text-danger'
                              }
                            >
                              {passwordRequirements.hasNumber ? '✓' : '✗'} One number (0-9)
                            </small>
                            <small
                              className={
                                passwordRequirements.hasSpecialChar ? 'text-success' : 'text-danger'
                              }
                            >
                              {passwordRequirements.hasSpecialChar ? '✓' : '✗'} One special
                              character (!@#$%^&*...)
                            </small>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="mb-3">
                      <label htmlFor="confirmPassword" className="form-label">
                        Confirm Password
                      </label>
                      <div className="input-group">
                        <input
                          id="confirmPassword"
                          type={showConfirmPassword ? 'text' : 'password'}
                          className={`form-control form-control-lg ${
                            validationErrors.confirmPassword ? 'is-invalid' : ''
                          }`}
                          placeholder="Re-enter your password"
                          value={confirmPassword}
                          onChange={(e: ChangeEvent<HTMLInputElement>) => {
                            setConfirmPassword(e.target.value)
                            setValidationErrors({ ...validationErrors, confirmPassword: undefined })
                          }}
                          disabled={loading}
                        />
                        <button
                          className="btn btn-outline-secondary"
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          disabled={loading}
                          aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                        >
                          {showConfirmPassword ? (
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C97D60" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                              <line x1="1" y1="1" x2="23" y2="23"/>
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C97D60" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                              <circle cx="12" cy="12" r="3"/>
                            </svg>
                          )}
                        </button>
                        {validationErrors.confirmPassword && (
                          <div className="invalid-feedback">{validationErrors.confirmPassword}</div>
                        )}
                      </div>
                      {confirmPassword && password === confirmPassword && (
                        <small className="text-success d-block mt-2">✓ Passwords match</small>
                      )}
                    </div>

                    <div className="d-grid gap-2 mt-4">
                      <button
                        onClick={doSignUp}
                        className="btn btn-primary btn-lg"
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <span
                              className="spinner-border spinner-border-sm me-2"
                              role="status"
                              aria-hidden="true"
                            ></span>
                            Creating Account...
                          </>
                        ) : (
                          'Sign Up'
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="mb-3">
                      <label htmlFor="code" className="form-label">
                        Confirmation Code
                      </label>
                      <input
                        ref={codeInputRef}
                        id="code"
                        type="text"
                        className={`form-control form-control-lg ${
                          validationErrors.code ? 'is-invalid' : ''
                        }`}
                        placeholder="Enter 6-digit code"
                        value={code}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => {
                          setCode(e.target.value)
                          setValidationErrors({ ...validationErrors, code: undefined })
                        }}
                        disabled={loading}
                        maxLength={6}
                      />
                      {validationErrors.code && (
                        <div className="invalid-feedback">{validationErrors.code}</div>
                      )}
                      <small className="text-muted d-block mt-2">
                        Check your email inbox (and spam folder)
                      </small>
                    </div>

                    <div className="d-grid gap-2 mb-3">
                      <button
                        onClick={doConfirm}
                        className="btn btn-primary btn-lg"
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <span
                              className="spinner-border spinner-border-sm me-2"
                              role="status"
                              aria-hidden="true"
                            ></span>
                            Verifying...
                          </>
                        ) : (
                          'Confirm Email'
                        )}
                      </button>
                    </div>

                    <div className="text-center">
                      <small className="text-muted">Didn't receive the code? </small>
                      {resendCountdown > 0 ? (
                        <small className="countdown-text">
                          Resend available in {resendCountdown}s
                        </small>
                      ) : (
                        <button
                          onClick={doResendCode}
                          className="btn btn-link btn-sm p-0 resend-link"
                          disabled={loading}
                        >
                          Resend Code
                        </button>
                      )}
                    </div>

                    <div className="divider"></div>

                    <div className="text-center">
                      <small className="text-muted">Wrong email? </small>
                      <button
                        onClick={changeEmail}
                        className="btn btn-link btn-sm p-0"
                        disabled={loading}
                      >
                        Change Email
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
