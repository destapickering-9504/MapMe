import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import SignUp from '../SignUp'

// Mock Amplify
vi.mock('aws-amplify/auth', () => ({
  signUp: vi.fn(),
  confirmSignUp: vi.fn(),
  autoSignIn: vi.fn(),
}))

describe('SignUp Page', () => {
  it('renders sign up heading', () => {
    render(
      <BrowserRouter>
        <SignUp />
      </BrowserRouter>
    )

    expect(screen.getByRole('heading', { name: /create account/i })).toBeInTheDocument()
  })

  it('renders email input field', () => {
    render(
      <BrowserRouter>
        <SignUp />
      </BrowserRouter>
    )

    expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument()
  })

  it('renders password input field', () => {
    render(
      <BrowserRouter>
        <SignUp />
      </BrowserRouter>
    )

    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument()
  })

  it('renders confirm password input field', () => {
    render(
      <BrowserRouter>
        <SignUp />
      </BrowserRouter>
    )

    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument()
  })

  it('renders sign up button', () => {
    render(
      <BrowserRouter>
        <SignUp />
      </BrowserRouter>
    )

    expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument()
  })

  it('renders link to sign in page', () => {
    render(
      <BrowserRouter>
        <SignUp />
      </BrowserRouter>
    )

    const signInLink = screen.getByRole('link', { name: /sign in/i })
    expect(signInLink).toBeInTheDocument()
    expect(signInLink).toHaveAttribute('href', '/signin')
  })
})
