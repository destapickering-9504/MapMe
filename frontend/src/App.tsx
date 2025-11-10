import React from 'react'
import { Outlet } from 'react-router-dom'
import NavMenu from './components/NavMenu'
import Sidebar from './components/Sidebar'

export default function App(): JSX.Element {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <div style={{ flex: 1 }}>
        <NavMenu />
        <div style={{ padding: 16 }}>
          <Outlet />
        </div>
      </div>
    </div>
  )
}
