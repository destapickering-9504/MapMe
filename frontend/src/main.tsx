import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { Amplify } from 'aws-amplify'
import { cfg } from './aws-config'
import PublicLayout from './components/PublicLayout'
import AuthenticatedLayout from './components/AuthenticatedLayout'
import Landing from './pages/Landing'
import SignIn from './pages/SignIn'
import SignUp from './pages/SignUp'
import Onboarding from './pages/Onboarding'
import Home from './pages/Home'
import UpdateProfile from './pages/UpdateProfile'

// Configure AWS Amplify
Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: cfg.userPoolId,
      userPoolClientId: cfg.userPoolClientId,
      identityPoolId: cfg.identityPoolId,
      loginWith: {
        email: true,
      },
      userPoolEndpoint: `https://cognito-idp.${cfg.region}.amazonaws.com`,
    },
  },
  Storage: {
    S3: {
      bucket: cfg.avatarsBucket,
      region: cfg.region,
    },
  },
})

const router = createBrowserRouter([
  {
    path: '/',
    element: <PublicLayout />,
    children: [
      { index: true, element: <Landing /> },
      { path: 'signin', element: <SignIn /> },
      { path: 'signup', element: <SignUp /> },
    ],
  },
  {
    path: '/',
    element: <AuthenticatedLayout />,
    children: [
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
