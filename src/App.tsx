import { useEffect } from 'react';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { TokenVerification } from './pages/TokenVerification';
import { Home } from './pages/Home';
import { Areas } from './pages/Areas';
import { Users } from './pages/Users';
import { MainLayout } from './components/MainLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { CreateRequest } from './pages/CreateRequest';
import { ConfigSolicitation } from './pages/ConfigSolicitation';
import { Management } from './pages/Management';

const router = createBrowserRouter([
  { path: "/login", element: <Login /> },
  { path: "/register", element: <Register /> },
  { path: "/verify", element: <TokenVerification /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <MainLayout />,
        children: [
          { path: "/", element: <Home /> },
          { path: "/areas", element: <Areas /> },
          { path: "/users", element: <Users /> },
          { path: "/create-request", element: <CreateRequest /> },
          { path: "/config", element: <ConfigSolicitation /> },
          { path: "/management", element: <Management /> },
        ]
      }
    ]
  },
  { path: "*", element: <Navigate to="/" replace /> }
]);

export default function App() {
  const { theme } = useAuthStore();

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
  }, [theme]);

  return <RouterProvider router={router} />;
}