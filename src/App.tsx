import { RouterProvider, createBrowserRouter } from 'react-router-dom'
import { Layout } from './components/Layout'

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        lazy: () => import('./routes/HomePage'),
      },
      {
        path: 'products',
        lazy: () => import('./routes/ProductsPage'),
      },
      {
        path: 'products/:id',
        lazy: () => import('./routes/ProductDetailPage'),
      },
      {
        path: 'cart',
        lazy: () => import('./routes/CartPage'),
      },
    ],
  },
  {
    path: '/auth',
    lazy: () => import('./routes/AuthPage'),
  },
  {
    path: '/auth/callback',
    lazy: () => import('./routes/AuthCallbackPage'),
  },
])

function App() {
  return <RouterProvider router={router} />
}

export default App
