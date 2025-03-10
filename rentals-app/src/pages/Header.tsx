// src/components/Header.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import './Header.css';

const Header = () => {
  return (
    <header className="header">
      <div className="header-content">
        <div className="flex items-center">
          <Link to="/" className="logo-link">
            <img src="assets/logo.png" alt="Logo" className="logo" />
          </Link>
          <h1>Musical Rentals</h1>
        </div>
        <nav>
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/register">Register</Link>
        </nav>
      </div>
    </header>
  );
};

export default Header;