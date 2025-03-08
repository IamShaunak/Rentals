import React, { useState } from 'react';
import axios from 'axios'; // Should work after installation
import { useNavigate } from 'react-router-dom'; // Should work after installation
import './RenterRegistration.css';

const RenterRegistration = () => {
  const [formData, setFormData] = useState({
    entityName: '',
    pocName: '',
    isPocSameAsEntity: false,
    phoneNumber: '',
    location: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;

    setFormData((prevData) => ({
      ...prevData,
      [name]: newValue,
    }));

    if (name === 'isPocSameAsEntity' && checked) {
      setFormData((prevData) => ({
        ...prevData,
        pocName: prevData.entityName,
      }));
    } else if (name === 'entityName' && formData.isPocSameAsEntity) {
      setFormData((prevData) => ({
        ...prevData,
        pocName: value,
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.entityName.trim()) {
      newErrors.entityName = 'Entity name is required';
    }

    if (!formData.pocName.trim()) {
      newErrors.pocName = 'Point of Contact name is required';
    }

    const phoneRegex = /^\d{10}$/;
    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
    } else if (!phoneRegex.test(formData.phoneNumber.replace(/[^\d]/g, ''))) {
      newErrors.phoneNumber = 'Please enter a valid 10-digit phone number';
    }

    if (!formData.location.trim()) {
      newErrors.location = 'Location is required';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (validateForm()) {
      setLoading(true);
      try {
        const response = await axios.post('http://localhost:5000/api/register', {
          entityName: formData.entityName,
          pocName: formData.pocName,
          phoneNumber: formData.phoneNumber,
          location: formData.location,
          email: formData.email,
          password: formData.password,
        });
        alert(response.data.message);
        navigate('/dashboard');
      } catch (error) {
        console.error('Form submission error:', error);
        if (error.response) {
          setErrors({ server: error.response.data.message || 'Registration failed' });
        } else {
          setErrors({ server: 'Failed to connect to the server' });
        }
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="registration-container">
      <div className="registration-card">
        <div className="registration-header">
          <h2>Register as a Renter</h2>
          <p>Join our musical instrument rental community</p>
        </div>

        {errors.server && <div className="error-message server-error">{errors.server}</div>}

        <form onSubmit={handleSubmit} className="registration-form">
          <div className="form-section">
            <h3>Business Information</h3>

            <div className="form-group poc-group">
              <div className="poc-label-container">
                <label htmlFor="pocName">Point of Contact Name</label>
                <div className="checkbox-container">
                  <input
                    type="checkbox"
                    id="isPocSameAsEntity"
                    name="isPocSameAsEntity"
                    checked={formData.isPocSameAsEntity}
                    onChange={handleChange}
                  />
                  <label htmlFor="isPocSameAsEntity" className="checkbox-label">
                    Same as Entity Name
                  </label>
                </div>
              </div>
              <input
                type="text"
                id="pocName"
                name="pocName"
                value={formData.pocName}
                onChange={handleChange}
                className={errors.pocName ? 'error' : ''}
                placeholder="Enter contact person's name"
                disabled={formData.isPocSameAsEntity}
              />
              {errors.pocName && <span className="error-message">{errors.pocName}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="entityName">Entity Name</label>
              <input
                type="text"
                id="entityName"
                name="entityName"
                value={formData.entityName}
                onChange={handleChange}
                className={errors.entityName ? 'error' : ''}
                placeholder="Enter business or organization name"
              />
              {errors.entityName && <span className="error-message">{errors.entityName}</span>}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="phoneNumber">Phone Number</label>
                <input
                  type="tel"
                  id="phoneNumber"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  className={errors.phoneNumber ? 'error' : ''}
                  placeholder="(123) 456-7890"
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
                  placeholder="City, State"
                />
                {errors.location && <span className="error-message">{errors.location}</span>}
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Account Information</h3>

            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={errors.email ? 'error' : ''}
                placeholder="email@example.com"
              />
              {errors.email && <span className="error-message">{errors.email}</span>}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={errors.password ? 'error' : ''}
                  placeholder="Create a password"
                />
                {errors.password && <span className="error-message">{errors.password}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={errors.confirmPassword ? 'error' : ''}
                  placeholder="Confirm your password"
                />
                {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
              </div>
            </div>
          </div>

          <button type="submit" className="register-button" disabled={loading}>
            {loading ? 'Registering...' : 'Create Account'}
          </button>

          <div className="login-link">
            Already have an account? <a href="/login">Sign in</a>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RenterRegistration;