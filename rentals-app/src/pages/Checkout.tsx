// src/pages/Checkout.tsx
import React, { useState, FormEvent } from 'react';
import axios, { AxiosError, AxiosResponse } from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import './Checkout.css';

interface RentalItem {
  _id: string;
  category: string;
  modelNumber: string;
  pricePerHour: number;
  entityName: string;
  deliveryStatus: string;
  stock: number; // Add stock field
}

interface ApiResponse {
  message: string;
  rentalRequest?: {
    _id: string;
    customerName: string;
    contactNumber: string;
    rentalId: string;
    itemName: string;
    entityName: string;
    quantity: number;
    pricePerHour: number;
    rentalDurationHours: number;
    totalPrice: number;
    identityDocumentPath: string;
    status: string;
  };
}

const Checkout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { item } = location.state as { item: RentalItem };
  const [quantity, setQuantity] = useState(1);
  const [rentalDuration, setRentalDuration] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [identityDocument, setIdentityDocument] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const totalPrice = item.pricePerHour * quantity * (parseInt(rentalDuration) || 0);

  const handleQuantityChange = (delta: number) => {
    const newQuantity = quantity + delta;
    if (newQuantity < 1) {
      setError('Quantity must be at least 1');
    } else if (newQuantity > item.stock) {
      setError(`Requested quantity (${newQuantity}) exceeds available stock (${item.stock})`);
    } else {
      setQuantity(newQuantity);
      setError('');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setIdentityDocument(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Client-side validation
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(contactNumber)) {
      setError('Contact number must be a 10-digit number');
      setLoading(false);
      return;
    }

    if (!identityDocument) {
      setError('Please upload an identity verification document');
      setLoading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('rentalId', item._id);
      formData.append('quantity', quantity.toString());
      formData.append('rentalDurationHours', rentalDuration);
      formData.append('customerName', customerName);
      formData.append('contactNumber', contactNumber);
      if (identityDocument) {
        formData.append('identityDocument', identityDocument);
      }

      const response: AxiosResponse<ApiResponse> = await axios.post(
        'http://localhost:5000/api/rentals/checkout',
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        }
      );
      alert(response.data.message);
      navigate('/customer-items');
    } catch (err) {
      const error = err as AxiosError<ApiResponse>;
      setError(error.response?.data?.message || 'Failed to complete checkout. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="checkout-container">
      <h1>Checkout</h1>
      <div className="item-details">
        <h2>Item Details</h2>
        <p><strong>Item:</strong> {item.modelNumber}</p>
        <p><strong>Category:</strong> {item.category}</p>
        <p><strong>Price per Hour:</strong> ₹{item.pricePerHour}</p>
        <p><strong>Offered by:</strong> {item.entityName}</p>
        <p><strong>Available Stock:</strong> {item.stock}</p>
      </div>

      <form onSubmit={handleSubmit} className="checkout-form">
        {/* 1. Quantity */}
        <div className="form-group">
          <label>Quantity</label>
          <div className="quantity-selector">
            <button
              type="button"
              className="quantity-button"
              onClick={() => handleQuantityChange(-1)}
              disabled={quantity <= 1}
            >
              -
            </button>
            <span className="quantity-value">{quantity}</span>
            <button
              type="button"
              className="quantity-button"
              onClick={() => handleQuantityChange(1)}
              disabled={quantity >= item.stock}
            >
              +
            </button>
          </div>
        </div>

        {/* 2. Number of Hours */}
        <div className="form-group">
          <label htmlFor="rentalDuration">Rental Duration (hours)</label>
          <input
            type="number"
            id="rentalDuration"
            value={rentalDuration}
            onChange={(e) => setRentalDuration(e.target.value)}
            required
            min="1"
            placeholder="Enter rental duration in hours"
          />
        </div>

        {/* 3. Your Name */}
        <div className="form-group">
          <label htmlFor="customerName">Your Name</label>
          <input
            type="text"
            id="customerName"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            required
            placeholder="Enter your full name"
          />
        </div>

        {/* 4. Contact Number */}
        <div className="form-group">
          <label htmlFor="contactNumber">Contact Number</label>
          <input
            type="tel"
            id="contactNumber"
            value={contactNumber}
            onChange={(e) => setContactNumber(e.target.value)}
            required
            placeholder="Enter 10-digit contact number"
          />
        </div>

        {/* 5. Identity Verification Document */}
        <div className="form-group">
          <label htmlFor="identityDocument">Upload Identity Verification Document</label>
          <input
            type="file"
            id="identityDocument"
            name="identityDocument"
            onChange={handleFileChange}
            accept="image/jpeg,image/png,application/pdf"
            required
          />
        </div>

        <div className="total-price">
          <p><strong>Total Price:</strong> ₹{totalPrice.toFixed(2)}</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        <button type="submit" className="confirm-button" disabled={loading}>
          {loading ? 'Processing...' : 'Confirm Rental'}
        </button>
      </form>
    </div>
  );
};

export default Checkout;