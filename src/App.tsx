import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/auth/PrivateRoute';
import Layout from './components/layout/Layout';
import SignIn from './pages/auth/SignIn';
import Dashboard from './pages/Dashboard';
import Products from './pages/products/Products';
import ProductDetails from './pages/products/ProductDetails';
import Purchases from './pages/purchases/Purchases';
import RawMaterials from './pages/raw-materials/RawMaterials';
import Orders from './pages/orders/Orders';
import OrderDetails from './pages/orders/OrderDetails';
import LaborCosts from './pages/labor/LaborCosts';
import ButtonExample from './components/ui/ButtonExample';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <div className="h-full">
            <Routes>
              <Route path="/signin" element={<SignIn />} />
              <Route
                path="/"
                element={
                  <PrivateRoute>
                    <Layout>
                      <Dashboard />
                    </Layout>
                  </PrivateRoute>
                }
              />
              <Route
                path="/products"
                element={
                  <PrivateRoute>
                    <Layout>
                      <Products />
                    </Layout>
                  </PrivateRoute>
                }
              />
              <Route
                path="/products/:id"
                element={
                  <PrivateRoute>
                    <Layout>
                      <ProductDetails />
                    </Layout>
                  </PrivateRoute>
                }
              />
              <Route
                path="/raw-materials"
                element={
                  <PrivateRoute>
                    <Layout>
                      <RawMaterials />
                    </Layout>
                  </PrivateRoute>
                }
              />
              <Route
                path="/labor"
                element={
                  <PrivateRoute>
                    <Layout>
                      <LaborCosts />
                    </Layout>
                  </PrivateRoute>
                }
              />
              <Route
                path="/purchases"
                element={
                  <PrivateRoute>
                    <Layout>
                      <Purchases />
                    </Layout>
                  </PrivateRoute>
                }
              />
              <Route
                path="/orders"
                element={
                  <PrivateRoute>
                    <Layout>
                      <Orders />
                    </Layout>
                  </PrivateRoute>
                }
              />
              <Route
                path="/orders/:id"
                element={
                  <PrivateRoute>
                    <Layout>
                      <OrderDetails />
                    </Layout>
                  </PrivateRoute>
                }
              />
              
              <Route
                path="/button-examples"
                element={
                  <PrivateRoute>
                    <Layout>
                      <ButtonExample />
                    </Layout>
                  </PrivateRoute>
                }
              />
            </Routes>
          </div>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
