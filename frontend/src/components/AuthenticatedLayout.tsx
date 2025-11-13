import { Outlet } from 'react-router-dom'
import NavMenu from './NavMenu'
import Sidebar from './Sidebar'

export default function AuthenticatedLayout(): JSX.Element {
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
