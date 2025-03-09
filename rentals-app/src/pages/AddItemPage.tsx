// src/pages/AddItemPage.tsx
import React, { useState, FormEvent } from 'react';
import axios, { AxiosError, AxiosResponse } from 'axios';
import './AddItemPage.css';

// Define the API response type
interface ApiResponse {
  message: string;
  rental?: {
    _id: string;
    entityName: string;
    category: string;
    itemName: string;
    pricePerHour: number;
    deliveryStatus: string;
    createdAt: string;
  };
}

const AddItemPage = () => {
  const [category, setCategory] = useState('Drums');
  const [itemName, setItemName] = useState('');
  const [price, setPrice] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response: AxiosResponse<ApiResponse> = await axios.post(
        'http://localhost:5000/api/rentals',
        { category, itemName, pricePerHour: price }, // Send all fields
        { withCredentials: true }
      );
      alert(response.data.message);
      setItemName('');
      setPrice('');
    } catch (err) {
      const error = err as AxiosError<ApiResponse>;
      console.error('Error adding item:', error.response?.status, error.response?.data, error.message);
      setError(error.response?.data?.message || 'Failed to add item. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-item-page">
      <h1>Add Item to Rent Out</h1>
      {error && <div className="error-message">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Category:</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="Drums">Drums</option>
            <option value="Guitars">Guitars</option>
            <option value="Keyboards">Keyboards</option>
            <option value="Microphones">Microphones</option>
          </select>
        </div>
        <div className="form-group">
          <label>Name of the Item:</label>
          <input
            type="text"
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Price per Hour ($):</label>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
            min="0"
            step="0.01"
          />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? 'Submitting...' : 'Submit'}
        </button>
      </form>
    </div>
  );
};

export default AddItemPage;