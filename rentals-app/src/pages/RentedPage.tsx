// src/pages/RentedPage.tsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios, { AxiosError, AxiosResponse } from 'axios';
import './RentedPage.css';

// Define rental interface
interface Rental {
  _id: string;
  entityName: string;
  category: string;
  itemName: string;
  pricePerHour: number;
  deliveryStatus: string;
  trackingId?: string;
  createdAt: string;
}

// Define session response
interface SessionResponse {
  loggedIn: boolean;
  renterId?: string;
  entityName?: string;
}

const RentedPage = () => {
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [user, setUser] = useState<{ id: string; entityName: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSessionAndRentals = async () => {
      try {
        console.log('Fetching session...');
        const sessionResponse: AxiosResponse<SessionResponse> = await axios.get('http://localhost:5000/api/check-session', {
          withCredentials: true,
        });
        console.log('Session response:', sessionResponse.data);

        if (sessionResponse.data.loggedIn) {
          setUser({ id: sessionResponse.data.renterId!, entityName: sessionResponse.data.entityName! });
          console.log('Fetching rentals...');
          const rentalsResponse: AxiosResponse<Rental[]> = await axios.get('http://localhost:5000/api/rentals', {
            withCredentials: true,
          });
          console.log('Rentals response:', rentalsResponse.data);
          setRentals(rentalsResponse.data);
        } else {
          setError('Please log in to view your dashboard');
        }
      } catch (err) {
        const error = err as AxiosError<{ message: string }>;
        console.error('Error details:', error.response?.status, error.response?.data, error.message);
        setError('Failed to load dashboard. Please log in.');
      } finally {
        setLoading(false);
      }
    };

    fetchSessionAndRentals();
    const interval = setInterval(fetchSessionAndRentals, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <p>Loading...</p>;
  if (error) return (
    <p className="error-message">
      {error} <Link to="/login">Login</Link>
    </p>
  );

  return (
    <div className="rented-page">
      <div className="add-item-button-container">
        <Link to="/add-item">
          <button className="add-item-button">Add Item to Rent Out</button>
        </Link>
        {user && <p>Welcome, {user.entityName}!</p>}
      </div>
      <h1>{user.entityName}'s Rental DASHBOARD</h1>
      <div className="categories-container">
        {rentals.length === 0 ? (
          <p>No rented items found.</p>
        ) : (
          rentals.map((rental) => (
            <div key={rental._id} className="rental-card">
              <h2>{rental.itemName}</h2>
              <p>Category: {rental.category}</p>
              <p>Price per Hour: ${rental.pricePerHour}</p>
              <p>Delivery Status: {rental.deliveryStatus}</p>
              {rental.trackingId && <p>Tracking ID: {rental.trackingId}</p>}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default RentedPage;