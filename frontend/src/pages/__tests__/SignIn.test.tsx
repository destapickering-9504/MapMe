import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import SignIn from '../SignIn'

// Mock Amplify
vi.mock('aws-amplify/auth', () => ({
  signIn: vi.fn(),
  confirmSignIn: vi.fn(),
}))

describe('SignIn Page', () => {
  it('renders sign in heading', () => {
    render(
      <BrowserRouter>
        <SignIn />
      </BrowserRouter>
    )

    expect(screen.getByRole('heading', { name: /welcome back/i })).toBeInTheDocument()
  })

  it('renders email input field', () => {
    render(
      <BrowserRouter>
        <SignIn />
      </BrowserRouter>
    )

    expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument()
  })

  it('renders password input field', () => {
    render(
      <BrowserRouter>
        <SignIn />
      </BrowserRouter>
    )

    expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument()
  })

  it('renders sign in button', () => {
    render(
      <BrowserRouter>
        <SignIn />
      </BrowserRouter>
    )

    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('renders link to sign up page', () => {
    render(
      <BrowserRouter>
        <SignIn />
      </BrowserRouter>
    )

    const signUpLink = screen.getByRole('link', { name: /sign up/i })
    expect(signUpLink).toBeInTheDocument()
    expect(signUpLink).toHaveAttribute('href', '/signup')
  })
})
