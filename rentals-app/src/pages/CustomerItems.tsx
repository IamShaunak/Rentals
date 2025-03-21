import React, { useState, useEffect } from 'react';
import axios, { AxiosError, AxiosResponse } from 'axios';
import { useNavigate } from 'react-router-dom';
import './CustomerItems.css';

interface RentalItem {
  _id: string;
  category: string;
  subcategory?: string; // Optional, as per the schema
  brand: string;
  modelNumber: string; // Replaced itemName with modelNumber
  entityName: string;
  deliveryStatus: string;
  stock: number; // Included from the schema
  imagePaths?: string[]; // Optional, as per the schema
}

const CustomerItems = () => {
  const [categories] = useState<string[]>(['Drums', 'Guitars', 'Keyboards', 'Equipments', 'Others']);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [items, setItems] = useState<RentalItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const navigate = useNavigate();

  const fetchItemsByCategory = async (category: string) => {
    setLoading(true);
    setError('');
    try {
      const response: AxiosResponse<RentalItem[]> = await axios.get(
        `http://localhost:5000/api/rentals/category/${category}`
      );
      setItems(response.data || []);
    } catch (err) {
      const error = err as AxiosError<{ message: string }>;
      setError(error.response?.data?.message || 'Failed to fetch items. Please check your connection or try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryClick = (category: string) => {
    setSelectedCategory(category);
    fetchItemsByCategory(category);
  };

  const handleSelectItem = (item: RentalItem) => {
    navigate('/checkout', { state: { item } });
  };

  return (
    <div className="customer-items-container">
      <h1>Explore Musical Instruments for Rent</h1>
      <div className="categories">
        <h2>Categories</h2>
        <div className="category-list">
          {categories.map((category) => (
            <button
              key={category}
              className={`category-button ${selectedCategory === category ? 'active' : ''}`}
              onClick={() => handleCategoryClick(category)}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {selectedCategory && (
        <div className="items-section">
          <h2>{selectedCategory} Items</h2>
          {error && <div className="error-message">{error}</div>}
          {loading ? (
            <div>Loading...</div>
          ) : items.length === 0 ? (
            <div>No items available in this category.</div>
          ) : (
            <div className="items-list">
              {items.map((item) => (
                <div key={item._id} className="item-card">
                  <div className="item-image">
                    {item.imagePaths && item.imagePaths.length > 0 ? (
                      <img
                        src={`http://localhost:5000/${item.imagePaths[0]}`}
                        alt={item.modelNumber}
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextSibling.style.display = 'block';
                        }}
                      />
                    ) : null}
                    <div style={{ display: item.imagePaths && item.imagePaths.length > 0 ? 'none' : 'block' }}>
                      No Image
                    </div>
                  </div>
                  <div className="item-details">
                    <h3>{item.modelNumber}</h3>
                    <p>Category: {item.category}</p>
                    <p>Brand: {item.brand}</p>
                    <p>Stock: {item.stock} available</p>
                    <p>Offered by: {item.entityName}</p>
                    <p>Status: {item.deliveryStatus}</p>
                    <button
                      className="select-button"
                      onClick={() => handleSelectItem(item)}
                      disabled={item.deliveryStatus !== 'Pending' || item.stock <= 0}
                    >
                      {item.deliveryStatus === 'Pending' && item.stock > 0 ? 'Select' : 'Unavailable'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CustomerItems;