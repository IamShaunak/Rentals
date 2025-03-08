// src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Header from './pages/Header';
import RenterRegistration from './pages/RenterRegistration';
import RentedPage from './pages/RentedPage';
import AddItemPage from './pages/AddItemPage';
import Login from './pages/Login';
import CustomerInfo from './pages/CustomerInfo'; // Add this import

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
            <Route path="/login" element={<Login />} />
            <Route path="/customer-info" element={<CustomerInfo />} /> {/* Add this route */}
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;