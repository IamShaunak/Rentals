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
  const [categories, setCategories] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSessionAndCategories = async () => {
      try {
        console.log('Fetching session...');
        const sessionResponse: AxiosResponse<SessionResponse> = await axios.get('http://localhost:5000/api/check-session', {
          withCredentials: true,
        });
        console.log('Session response:', sessionResponse.data);

        if (sessionResponse.data.loggedIn) {
          setUser({ id: sessionResponse.data.renterId!, entityName: sessionResponse.data.entityName! });
          // Fetch custom categories
          const categoriesResponse: AxiosResponse<string[]> = await axios.get('http://localhost:5000/api/custom-categories', {
            withCredentials: true,
          });
          setCategories(categoriesResponse.data || ['all', 'drums', 'guitars', 'keyboards', 'equipments', 'others']);
        } else {
          setError('Please log in to view your dashboard');
        }
      } catch (err) {
        const error = err as AxiosError<{ message: string }>;
        console.error('Error details:', error.response?.status, error.response?.data, error.message);
        setError('Failed to load dashboard or categories. Please log in.');
      }
    };

    fetchSessionAndCategories();
  }, []);

  const handleCategoryClick = (category: string) => {
    navigate(`/category/${category}`); // Redirect to the new page
  };

  const handleEditCategories = () => {
    setEditMode(true);
  };

  const handleSaveCategories = async () => {
    try {
      await axios.put(
        'http://localhost:5000/api/custom-categories',
        { categories },
        { withCredentials: true }
      );
      setEditMode(false);
    } catch (err) {
      const error = err as AxiosError<{ message: string }>;
      setError(error.response?.data?.message || 'Failed to update categories.');
    }
  };

  const handleAddCategory = () => {
    if (newCategory.trim() && !categories.includes(newCategory.trim().toLowerCase())) {
      setCategories([...categories, newCategory.trim()]);
      setNewCategory('');
    }
  };

  const handleRemoveCategory = (categoryToRemove: string) => {
    setCategories(categories.filter((cat) => cat !== categoryToRemove));
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
        {user && (
          <>
            <p>Welcome, {user.entityName}!</p>
            <button className="edit-categories-button" onClick={handleEditCategories}>
              Edit Categories
            </button>
          </>
        )}
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
              {editMode && (
                <button
                  className="remove-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveCategory(category);
                  }}
                >
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>
        {editMode && (
          <div className="edit-categories">
            <input
              type="text"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="Add new category"
            />
            <button onClick={handleAddCategory}>Add</button>
            <button onClick={handleSaveCategories}>Save</button>
            <button onClick={() => setEditMode(false)}>Cancel</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RentedPage;