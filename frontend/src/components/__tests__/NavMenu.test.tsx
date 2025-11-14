import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import NavMenu from '../NavMenu'
import * as auth from 'aws-amplify/auth'

vi.mock('aws-amplify/auth', () => ({
  signOut: vi.fn(),
}))

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

describe('NavMenu', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders sign out button', () => {
    render(
      <BrowserRouter>
        <NavMenu />
      </BrowserRouter>
    )

    expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument()
  })

  it('calls signOut and navigates to signin when button is clicked', async () => {
    vi.mocked(auth.signOut).mockResolvedValue()

    render(
      <BrowserRouter>
        <NavMenu />
      </BrowserRouter>
    )

    const signOutButton = screen.getByRole('button', { name: /sign out/i })
    fireEvent.click(signOutButton)

    await waitFor(() => {
      expect(auth.signOut).toHaveBeenCalledTimes(1)
      expect(mockNavigate).toHaveBeenCalledWith('/signin')
    })
  })
})
