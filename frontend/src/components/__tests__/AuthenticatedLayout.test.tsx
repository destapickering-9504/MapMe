import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import AuthenticatedLayout from '../AuthenticatedLayout'
import * as auth from 'aws-amplify/auth'

vi.mock('aws-amplify/auth', () => ({
  getCurrentUser: vi.fn(),
}))

vi.mock('../NavMenu', () => ({
  default: () => <div>NavMenu</div>,
}))

vi.mock('../Sidebar', () => ({
  default: () => <div>Sidebar</div>,
}))

describe('AuthenticatedLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows loading state initially', async () => {
    let resolvePromise: () => void
    const promise = new Promise<{ userId: string; username: string }>((resolve) => {
      resolvePromise = () => resolve({ userId: 'test', username: 'test' })
    })
    vi.mocked(auth.getCurrentUser).mockReturnValue(promise)

    render(
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AuthenticatedLayout />} />
        </Routes>
      </BrowserRouter>
    )

    expect(screen.getAllByText('Loading...').length).toBeGreaterThan(0)
    expect(screen.getByRole('status')).toBeInTheDocument()

    // Clean up by resolving the promise
    resolvePromise!()
    await promise
  })

  it('renders authenticated layout when user is authenticated', async () => {
    vi.mocked(auth.getCurrentUser).mockResolvedValue({
      userId: 'test-user',
      username: 'testuser',
    })

    const TestChild = () => <div>Authenticated Content</div>

    render(
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AuthenticatedLayout />}>
            <Route index element={<TestChild />} />
          </Route>
        </Routes>
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Sidebar')).toBeInTheDocument()
      expect(screen.getByText('NavMenu')).toBeInTheDocument()
      expect(screen.getByText('Authenticated Content')).toBeInTheDocument()
    })
  })

  it('redirects to signin when user is not authenticated', async () => {
    vi.mocked(auth.getCurrentUser).mockRejectedValue(new Error('Not authenticated'))

    render(
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AuthenticatedLayout />} />
          <Route path="/signin" element={<div>Sign In Page</div>} />
        </Routes>
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Sign In Page')).toBeInTheDocument()
    })
  })
})
