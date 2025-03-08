// src/pages/RentedPage.tsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './RentedPage.css';

const RentedPage = () => {
  const [rentals, setRentals] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSessionAndRentals = async () => {
      try {
        // Check session status
        const sessionResponse = await axios.get('http://localhost:5000/api/check-session', { withCredentials: true });
        if (sessionResponse.data.loggedIn) {
          setUser({ id: sessionResponse.data.renterId, entityName: sessionResponse.data.entityName });
          // Fetch rentals for the logged-in user (extend backend to filter by renterId)
          const rentalsResponse = await axios.get(`http://localhost:5000/api/rentals?userId=${sessionResponse.data.renterId}`);
          setRentals(rentalsResponse.data);
        } else {
          setError('Please log in to view your dashboard');
        }
      } catch (err) {
        setError('Failed to load dashboard. Please log in.');
        console.error('Error fetching session or rentals:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSessionAndRentals();
    const interval = setInterval(fetchSessionAndRentals, 10000); // Poll every 10 seconds
    return () => clearInterval(interval);
  }, []);

  if (loading) return <p>Loading...</p>;
  if (error) return <p className="error-message">{error} <Link to="/login">Login</Link></p>;

  return (
    <div className="rented-page">
      <div className="add-item-button-container">
        <Link to="/add-item">
          <button className="add-item-button">Add Item to Rent Out</button>
        </Link>
        {user && <p>Welcome, {user.entityName}!</p>}
      </div>
      <h1>Rented Items Overview</h1>
      <div className="categories-container">
        {rentals.map((rental) => (
          <div key={rental._id} className="rental-card">
            <h2>{rental.itemName}</h2>
            <p>Delivery Status: {rental.deliveryStatus}</p>
            {rental.trackingId && <p>Tracking ID: {rental.trackingId}</p>}
          </div>
        ))}
      </div>
    </div>
  );
};

export default RentedPage;