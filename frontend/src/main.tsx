import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import App from './App'
import SignIn from './pages/SignIn'
import SignUp from './pages/SignUp'
import Onboarding from './pages/Onboarding'
import Home from './pages/Home'
import UpdateProfile from './pages/UpdateProfile'

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <SignIn /> },
      { path: 'signin', element: <SignIn /> },
      { path: 'signup', element: <SignUp /> },
      { path: 'onboarding', element: <Onboarding /> },
      { path: 'home', element: <Home /> },
      { path: 'update', element: <UpdateProfile /> },
    ],
  },
])

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
)
