import { createBrowserRouter, Navigate } from 'react-router-dom';
import Protected from './Protected';

// Lazy load pages for better performance
import { lazy } from 'react';

const Landing = lazy(() => import('../pages/Landing'));
const Login = lazy(() => import('../pages/Auth/Login'));
const Signup = lazy(() => import('../pages/Auth/Signup'));
const Dashboard = lazy(() => import('../pages/Dashboard/index'));
const Scan = lazy(() => import('../pages/Dashboard/Scan'));
const Inventory = lazy(() => import('../pages/Dashboard/Inventory'));
const Recipes = lazy(() => import('../pages/Dashboard/Recipes'));

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Landing />,
  },
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/signup',
    element: <Signup />,
  },
  {
    path: '/app',
    element: <Protected />,
    children: [
      {
        index: true,
        element: <Navigate to="/app/scan" replace />,
      },
      {
        path: '',
        element: <Dashboard />,
        children: [
          {
            path: 'scan',
            element: <Scan />,
          },
          {
            path: 'inventory',
            element: <Inventory />,
          },
          {
            path: 'recipes',
            element: <Recipes />,
          },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);
