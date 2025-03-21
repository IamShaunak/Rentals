import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import axios, { AxiosError, AxiosResponse } from 'axios';
import './CategoryItemsPage.css';

// Define rental interface
interface Rental {
  _id: string;
  entityName: string;
  category: string;
  modelNumber: string;
  deliveryStatus: string;
  trackingId?: string;
  createdAt: string;
  stock: number; // Total available
  rented?: number; // Number of items rented (optional, can be derived)
  imagePaths?: string[]; // Array of image paths
}

// Define session response
interface SessionResponse {
  loggedIn: boolean;
  renterId?: string;
  entityName?: string;
}

const CategoryItemsPage = () => {
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [user, setUser] = useState<{ id: string; entityName: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { category } = useParams<{ category: string }>(); // Get category from URL

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

  useEffect(() => {
    const fetchRentalsByCategory = async () => {
      if (!user || !category) return;

      try {
        setLoading(true);
        setError('');
        let url = 'http://localhost:5000/api/rentals';
        const normalizedCategory = category === 'all' ? null : category.charAt(0).toUpperCase() + category.slice(1);
        if (normalizedCategory) {
          url = `http://localhost:5000/api/rentals/category/${normalizedCategory}`;
        }
        console.log('Fetching from URL:', url);
        const rentalsResponse: AxiosResponse<Rental[]> = await axios.get(url, {
          withCredentials: true,
        });
        console.log('Rentals response data:', rentalsResponse.data);

        // If rented is not provided, assume rented = stock - some value (placeholder)
        const rentalsWithRented = rentalsResponse.data.map(rental => ({
          ...rental,
          rented: rental.rented || (rental.stock > 0 ? Math.floor(rental.stock * 0.3) : 0), // Placeholder: 30% of stock rented
        }));
        setRentals(rentalsWithRented);
      } catch (err) {
        const error = err as AxiosError<{ message: string }>;
        console.error('Error fetching rentals:', error.response?.status, error.response?.data, error.message);
        setError(error.response?.data?.message || 'Failed to fetch rentals.');
      } finally {
        setLoading(false);
      }
    };

    if (user && category) {
      fetchRentalsByCategory();
      const interval = setInterval(fetchRentalsByCategory, 10000);
      return () => clearInterval(interval);
    }
  }, [user, category]);

  const handleEdit = (rentalId: string) => {
    navigate(`/add-item?edit=${rentalId}`);
  };

  const handleDelete = (rentalId: string) => {
    // Add delete logic here (e.g., API call to delete the rental)
    console.log('Delete rental:', rentalId);
    // Example: axios.delete(`/api/rentals/${rentalId}`).then(() => setRentals(rentals.filter(r => r._id !== rentalId)));
    // Implement the actual delete endpoint in server.js if needed
  };

  if (error) return (
    <p className="error-message">
      {error} <Link to="/login">Login</Link>
    </p>
  );

  return (
    <div className="category-items-page">
      <div className="add-item-button-container">
        <Link to="/rented">
          <button className="dashboard-button">Back to Dashboard</button>
        </Link>
        <Link to="/add-item">
          <button className="add-item-button">Add Item to Rent Out</button>
        </Link>
        {user && <p>Welcome, {user.entityName}!</p>}
      </div>
      <h1>{category ? `${category.charAt(0).toUpperCase() + category.slice(1)} Rentals` : 'All Rentals'}</h1>
      <div className="rentals-container">
        {loading ? (
          <p>Loading...</p>
        ) : error ? (
          <p className="error-message">{error}</p>
        ) : rentals.length === 0 ? (
          <p>No rented items found for this category.</p>
        ) : (
          <div className="rentals-list">
            {rentals.map((rental) => (
              <div key={rental._id} className="rental-card">
                <div className="rental-image">
                  {rental.imagePaths && rental.imagePaths.length > 0 ? (
                    <img src={`http://localhost:5000/${rental.imagePaths[0]}`} alt={rental.modelNumber} />
                  ) : (
                    <div>No Image</div>
                  )}
                </div>
                <div className="rental-details">
                  <p><strong>Model No:</strong> {rental.modelNumber}</p>
                  <p><strong>Category:</strong> {rental.category}</p>
                  <p><strong>In Stock:</strong> {rental.stock}</p>
                  <p><strong>Rented:</strong> {rental.rented || 0}</p>
                  <div className="button-group">
                    <button className="edit-button" onClick={() => handleEdit(rental._id)}>
                      Edit
                    </button>
                    <button className="delete-button" onClick={() => handleDelete(rental._id)}>
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryItemsPage;