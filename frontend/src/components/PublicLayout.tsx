import { Outlet } from 'react-router-dom'

export default function PublicLayout(): JSX.Element {
  return (
    <div className="min-vh-100">
      <Outlet />
    </div>
  )
}
