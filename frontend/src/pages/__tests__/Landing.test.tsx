import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import Landing from '../Landing'

describe('Landing', () => {
  it('renders the MapMe logo', () => {
    render(
      <BrowserRouter>
        <Landing />
      </BrowserRouter>
    )

    const logo = screen.getByAltText('MapMe Logo')
    expect(logo).toBeInTheDocument()
    expect(logo).toHaveAttribute('src', '/MapMeLogo.png')
  })

  it('renders the main heading', () => {
    render(
      <BrowserRouter>
        <Landing />
      </BrowserRouter>
    )

    expect(screen.getByRole('heading', { name: /mapme/i })).toBeInTheDocument()
  })

  it('renders sign in link', () => {
    render(
      <BrowserRouter>
        <Landing />
      </BrowserRouter>
    )

    const signInLink = screen.getByRole('link', { name: /sign in/i })
    expect(signInLink).toBeInTheDocument()
    expect(signInLink).toHaveAttribute('href', '/signin')
  })

  it('renders create account link', () => {
    render(
      <BrowserRouter>
        <Landing />
      </BrowserRouter>
    )

    const signUpLink = screen.getByRole('link', { name: /create account/i })
    expect(signUpLink).toBeInTheDocument()
    expect(signUpLink).toHaveAttribute('href', '/signup')
  })

  it('renders the taglines and description', () => {
    render(
      <BrowserRouter>
        <Landing />
      </BrowserRouter>
    )

    expect(screen.getByText(/your location-based discovery platform/i)).toBeInTheDocument()
    expect(screen.getByText(/find places, experiences, and services near you/i)).toBeInTheDocument()
    expect(
      screen.getByText(/discover what's around you with smart, personalized recommendations/i)
    ).toBeInTheDocument()
  })

  it('has proper layout structure', () => {
    const { container } = render(
      <BrowserRouter>
        <Landing />
      </BrowserRouter>
    )

    expect(container.querySelector('.min-vh-100')).toBeInTheDocument()
  })
})
