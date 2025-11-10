import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import Sidebar from '../Sidebar'

describe('Sidebar Component', () => {
  it('renders the MapMe title', () => {
    render(
      <BrowserRouter>
        <Sidebar />
      </BrowserRouter>
    )

    expect(screen.getByText('MapMe')).toBeInTheDocument()
  })

  it('renders all navigation links', () => {
    render(
      <BrowserRouter>
        <Sidebar />
      </BrowserRouter>
    )

    expect(screen.getByText('Home')).toBeInTheDocument()
    expect(screen.getByText('Update info')).toBeInTheDocument()
    expect(screen.getByText('New search')).toBeInTheDocument()
    expect(screen.getByText('Near me')).toBeInTheDocument()
  })

  it('has correct link hrefs', () => {
    render(
      <BrowserRouter>
        <Sidebar />
      </BrowserRouter>
    )

    const homeLink = screen.getByText('Home').closest('a')
    expect(homeLink).toHaveAttribute('href', '/home')
  })
})
