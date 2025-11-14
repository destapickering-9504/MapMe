import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import Home from '../Home'
import * as auth from 'aws-amplify/auth'

vi.mock('aws-amplify/auth', () => ({
  fetchAuthSession: vi.fn(),
}))

global.fetch = vi.fn()

describe('Home', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(auth.fetchAuthSession).mockResolvedValue({
      tokens: {
        idToken: {
          toString: () => 'mock-token',
        },
      },
    } as Awaited<ReturnType<typeof auth.fetchAuthSession>>)
  })

  it('renders home heading', () => {
    vi.mocked(global.fetch).mockResolvedValue({
      json: async () => [],
    } as Response)

    render(<Home />)

    expect(screen.getByRole('heading', { name: /home/i })).toBeInTheDocument()
  })

  it('fetches and displays searches on mount', async () => {
    const mockSearches = [
      { userId: 'user1', createdAt: '1700000000', query: 'Coffee shops' },
      { userId: 'user1', createdAt: '1700000100', query: 'Restaurants' },
    ]

    vi.mocked(global.fetch).mockResolvedValue({
      json: async () => mockSearches,
    } as Response)

    render(<Home />)

    await waitFor(() => {
      expect(screen.getByText(/Coffee shops/i)).toBeInTheDocument()
      expect(screen.getByText(/Restaurants/i)).toBeInTheDocument()
    })
  })

  it('displays add sample search button', () => {
    vi.mocked(global.fetch).mockResolvedValue({
      json: async () => [],
    } as Response)

    render(<Home />)

    expect(screen.getByRole('button', { name: /add sample search/i })).toBeInTheDocument()
  })

  it('adds a new search when button is clicked', async () => {
    const initialSearches = [{ userId: 'user1', createdAt: '1700000000', query: 'Coffee shops' }]
    const updatedSearches = [
      ...initialSearches,
      { userId: 'user1', createdAt: '1700000200', query: 'Near me' },
    ]

    vi.mocked(global.fetch)
      .mockResolvedValueOnce({
        json: async () => initialSearches,
      } as Response)
      .mockResolvedValueOnce({
        json: async () => ({ ok: true }),
      } as Response)
      .mockResolvedValueOnce({
        json: async () => updatedSearches,
      } as Response)

    render(<Home />)

    await waitFor(() => {
      expect(screen.getByText(/Coffee shops/i)).toBeInTheDocument()
    })

    const addButton = screen.getByRole('button', { name: /add sample search/i })
    fireEvent.click(addButton)

    await waitFor(() => {
      expect(screen.getByText(/Near me/i)).toBeInTheDocument()
    })
  })

  it('handles fetch errors gracefully', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.mocked(global.fetch).mockRejectedValue(new Error('API Error'))

    render(<Home />)

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalled()
    })

    consoleErrorSpy.mockRestore()
  })

  it('sends correct authorization header', async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      json: async () => [],
    } as Response)

    render(<Home />)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'mock-token',
            'Content-Type': 'application/json',
          }),
        })
      )
    })
  })

  it('formats dates correctly in search list', async () => {
    const mockSearches = [{ userId: 'user1', createdAt: '1700000000', query: 'Test query' }]

    vi.mocked(global.fetch).mockResolvedValue({
      json: async () => mockSearches,
    } as Response)

    render(<Home />)

    await waitFor(() => {
      const listItem = screen.getByText(/Test query/i).closest('li')
      expect(listItem).toBeInTheDocument()
      expect(listItem?.textContent).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/)
    })
  })
})
