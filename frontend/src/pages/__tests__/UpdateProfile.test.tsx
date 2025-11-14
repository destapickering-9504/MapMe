import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import UpdateProfile from '../UpdateProfile'

vi.mock('../Onboarding', () => ({
  default: () => <div>Onboarding Component</div>,
}))

describe('UpdateProfile', () => {
  it('renders the heading', () => {
    render(
      <BrowserRouter>
        <UpdateProfile />
      </BrowserRouter>
    )

    expect(screen.getByRole('heading', { name: /update your info/i })).toBeInTheDocument()
  })

  it('renders the Onboarding component', () => {
    render(
      <BrowserRouter>
        <UpdateProfile />
      </BrowserRouter>
    )

    expect(screen.getByText('Onboarding Component')).toBeInTheDocument()
  })
})
