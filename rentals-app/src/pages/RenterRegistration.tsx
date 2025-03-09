// src/pages/RenterRegistration.tsx
import React, { useState, FormEvent } from 'react';
import axios, { AxiosError, AxiosResponse } from 'axios';
import { useNavigate } from 'react-router-dom';
import './RenterRegistration.css';

interface FormData {
  entityName: string;
  pocName: string;
  phoneNumber: string;
  location: string;
  email: string;
  password: string;
}

interface ApiResponse {
  message: string;
}

const RenterRegistration = () => {
  const [formData, setFormData] = useState<FormData>({
    entityName: '',
    pocName: '',
    phoneNumber: '',
    location: '',
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.entityName) newErrors.entityName = 'Entity Name is required';
    if (!formData.pocName) newErrors.pocName = 'Point of Contact Name is required';
    if (!formData.phoneNumber) newErrors.phoneNumber = 'Phone Number is required';
    if (!formData.location) newErrors.location = 'Location is required';
    if (!formData.email) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';
    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (validateForm()) {
      setLoading(true);
      try {
        const response: AxiosResponse<ApiResponse> = await axios.post('http://localhost:5000/api/register', formData);
        alert(response.data.message);
        navigate('/login');
      } catch (error) {
        const err = error as AxiosError<ApiResponse>;
        setErrors({ server: err.response?.data?.message || 'Registration failed' });
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="registration-container">
      <div className="registration-card">
        <h2>Renter Registration</h2>
        <p>Join us to start renting out your musical equipment!</p>

        {errors.server && <div className="error-message">{errors.server}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="entityName">Entity Name</label>
            <input
              type="text"
              id="entityName"
              name="entityName"
              value={formData.entityName}
              onChange={handleChange}
              className={errors.entityName ? 'error' : ''}
            />
            {errors.entityName && <span className="error-message">{errors.entityName}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="pocName">Point of Contact Name</label>
            <input
              type="text"
              id="pocName"
              name="pocName"
              value={formData.pocName}
              onChange={handleChange}
              className={errors.pocName ? 'error' : ''}
            />
            {errors.pocName && <span className="error-message">{errors.pocName}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="phoneNumber">Phone Number</label>
            <input
              type="tel"
              id="phoneNumber"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              className={errors.phoneNumber ? 'error' : ''}
            />
            {errors.phoneNumber && <span className="error-message">{errors.phoneNumber}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="location">Location</label>
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              className={errors.location ? 'error' : ''}
            />
            {errors.location && <span className="error-message">{errors.location}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={errors.email ? 'error' : ''}
            />
            {errors.email && <span className="error-message">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={errors.password ? 'error' : ''}
            />
            {errors.password && <span className="error-message">{errors.password}</span>}
          </div>

          <button type="submit" disabled={loading}>
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>

        <div className="login-link">
          Already have an account? <a href="/login">Login</a>
        </div>
      </div>
    </div>
  );
};

export default RenterRegistration;