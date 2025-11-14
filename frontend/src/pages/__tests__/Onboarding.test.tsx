import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import Onboarding from '../Onboarding'

// Mock Amplify
vi.mock('aws-amplify/auth', () => ({
  fetchAuthSession: vi.fn(() =>
    Promise.resolve({
      tokens: { idToken: { toString: () => 'mock-token' } },
    })
  ),
  getCurrentUser: vi.fn(() =>
    Promise.resolve({
      userId: 'test-user',
      username: 'testuser',
    })
  ),
}))

// Mock fetch
global.fetch = vi.fn()

// Mock AvatarUpload component
vi.mock('../../components/AvatarUpload', () => ({
  default: () => <div>Avatar Upload Component</div>,
}))

describe('Onboarding Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ name: 'Test User', avatarUrl: '' }),
    } as Response)
  })

  it('renders onboarding heading', async () => {
    render(
      <BrowserRouter>
        <Onboarding />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /welcome to mapme/i })).toBeInTheDocument()
    })
  })

  it('renders name input field', async () => {
    render(
      <BrowserRouter>
        <Onboarding />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/your name/i)).toBeInTheDocument()
    })
  })

  it('renders continue button', async () => {
    render(
      <BrowserRouter>
        <Onboarding />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /continue to mapme/i })).toBeInTheDocument()
    })
  })

  it('renders avatar upload component', async () => {
    render(
      <BrowserRouter>
        <Onboarding />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText(/avatar upload component/i)).toBeInTheDocument()
    })
  })

  it('renders skip button', async () => {
    render(
      <BrowserRouter>
        <Onboarding />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /skip for now/i })).toBeInTheDocument()
    })
  })
})
