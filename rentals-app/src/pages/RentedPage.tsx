import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios, { AxiosError, AxiosResponse } from 'axios';
import './RentedPage.css';

// Define session response
interface SessionResponse {
  loggedIn: boolean;
  renterId?: string;
  entityName?: string;
}

const RentedPage = () => {
  const [user, setUser] = useState<{ id: string; entityName: string } | null>(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Categories list
  const categories = ['all', 'drums', 'guitars', 'keyboards', 'equipments', 'others'];

  useEffect(() => {
    const fetchSession = async () => {
      try {
        console.log('Fetching session...');
        const sessionResponse: AxiosResponse<SessionResponse> = await axios.get('http://localhost:5000/api/check-session', {
          withCredentials: true,
        });
        console.log('Session response:', sessionResponse.data);

        if (sessionResponse.data.loggedIn) {
          setUser({ id: sessionResponse.data.renterId!, entityName: sessionResponse.data.entityName! });
        } else {
          setError('Please log in to view your dashboard');
        }
      } catch (err) {
        const error = err as AxiosError<{ message: string }>;
        console.error('Error details:', error.response?.status, error.response?.data, error.message);
        setError('Failed to load dashboard. Please log in.');
      }
    };

    fetchSession();
  }, []);

  const handleCategoryClick = (category: string) => {
    navigate(`/category/${category}`); // Redirect to the new page
  };

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
      <h1>{user ? `${user.entityName}'s Rental DASHBOARD` : 'Rental DASHBOARD'}</h1>
      <div className="categories-container">
        <div className="category-list">
          {categories.map((category) => (
            <div
              key={category}
              className="category-card"
              onClick={() => handleCategoryClick(category)}
            >
              <h3>{category.charAt(0).toUpperCase() + category.slice(1)}</h3>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RentedPage;