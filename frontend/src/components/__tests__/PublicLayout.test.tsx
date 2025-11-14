import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import PublicLayout from '../PublicLayout'
import { getCurrentUser } from 'aws-amplify/auth'

// Mock AWS Amplify auth functions
vi.mock('aws-amplify/auth', () => ({
  getCurrentUser: vi.fn(),
  fetchAuthSession: vi.fn(),
}))

describe('PublicLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Default: mock user as not authenticated
    vi.mocked(getCurrentUser).mockRejectedValue(new Error('Not authenticated'))
  })

  it('renders the layout container', async () => {
    render(
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<PublicLayout />} />
        </Routes>
      </BrowserRouter>
    )

    // Wait for auth check to complete
    await waitFor(() => {
      const container = document.querySelector('.min-vh-100')
      expect(container).toBeInTheDocument()
    })
  })

  it('renders children through Outlet', async () => {
    const TestChild = () => <div>Test Child Content</div>

    render(
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<PublicLayout />}>
            <Route index element={<TestChild />} />
          </Route>
        </Routes>
      </BrowserRouter>
    )

    // Wait for auth check to complete and child to render
    await waitFor(() => {
      expect(screen.getByText('Test Child Content')).toBeInTheDocument()
    })
  })
})
