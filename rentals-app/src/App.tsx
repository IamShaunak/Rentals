import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, Outlet } from 'react-router-dom';
import Header from './pages/Header';
import RenterRegistration from './pages/RenterRegistration';
import RentedPage from './pages/RentedPage';
import AddItemPage from './pages/AddItemPage';
import Login from './pages/Login';
import CustomerInfo from './pages/CustomerInfo';
import CustomerItems from './pages/CustomerItems';
import Checkout from './pages/Checkout';
import CategoryItemsPage from './pages/CategoryItemsPage';
import axios, { AxiosResponse } from 'axios';

// Define SessionResponse interface (assuming this is the shape of your session check response)
interface SessionResponse {
  loggedIn: boolean;
}

// ProtectedRoute component to check authentication
const ProtectedRoute = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const sessionResponse: AxiosResponse<SessionResponse> = await axios.get('http://localhost:5000/api/check-session', {
          withCredentials: true,
        });
        setIsAuthenticated(sessionResponse.data.loggedIn);
      } catch (err) {
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  if (loading) return <p>Loading...</p>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return <Outlet />;
};

function App() {
  return (
    <Router>
      <div className="flex flex-col min-h-screen">
        <Header />
        <div className="main-content flex-grow">
          <Routes>
            {/* Public Routes */}
            <Route path="/customer-items" element={<CustomerItems />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<RenterRegistration />} />
            <Route path="/checkout" element={<Checkout />} /> {/* Assuming this should be public too */}
            <Route path="/category/:category" element={<CategoryItemsPage />} /> {/* Assuming public */}

            {/* Protected Routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<RentedPage />} />
              <Route path="/add-item" element={<AddItemPage />} />
              <Route path="/customer-info" element={<CustomerInfo />} />
            </Route>

            {/* Optional: Redirect root to customer-items */}
            <Route path="/" element={<Navigate to="/customer-items" replace />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;