import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import PublicLayout from '../PublicLayout'

describe('PublicLayout', () => {
  it('renders the layout container', () => {
    render(
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<PublicLayout />} />
        </Routes>
      </BrowserRouter>
    )

    const container = document.querySelector('.min-vh-100')
    expect(container).toBeInTheDocument()
  })

  it('renders children through Outlet', () => {
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

    expect(screen.getByText('Test Child Content')).toBeInTheDocument()
  })
})
