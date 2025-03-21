// src/App.tsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, Outlet } from 'react-router-dom';
import Header from './pages/Header';
import RenterRegistration from './pages/RenterRegistration';
import RentedPage from './pages/RentedPage';
import AddItemPage from './pages/AddItemPage';
import Login from './pages/Login';
import CustomerInfo from './pages/CustomerInfo'; // Add this import
import CustomerItems from './pages/CustomerItems'; // Ensure this import exists
import Checkout from './pages/Checkout'; // Ensure this import exists
import CategoryItemsPage from './pages/CategoryItemsPage';
import axios, { AxiosResponse } from 'axios';

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

// Placeholder CustomerItemsPage (to be implemented)
const CustomerItemsPage = () => {
  return <div>Customer Items Page (Public - Implement your content here)</div>;
};

function App() {
  return (
    <Router>
      <div className="flex flex-col min-h-screen">
        <Header />
        <div className="main-content flex-grow">
          <Routes>
            <Route path="/register" element={<RenterRegistration />} />
            <Route path="/dashboard" element={<RentedPage />} />
            <Route path="/add-item" element={<AddItemPage />} />
            <Route path="/category/:category" element={<CategoryItemsPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/customer-info" element={<CustomerInfo />} /> {/* Add this route */}
            <Route path="/customer-items" element={<CustomerItems />} />
            <Route path="/checkout" element={<Checkout />} /> {/* New route */}
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;