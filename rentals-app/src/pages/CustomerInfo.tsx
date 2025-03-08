// src/pages/CustomerInfo.tsx
import React, { useState, FormEvent } from 'react';
import axios, { AxiosError, AxiosResponse } from 'axios'; // Corrected import
import { useNavigate } from 'react-router-dom';
import './CustomerInfo.css';

// Define the shape of the form data
interface CustomerFormData {
  aadharNumber: string;
  name: string;
  contactNumber: string;
  location: string;
  aadharDocument: File | null;
}

// Define the expected API response
interface ApiResponse {
  message: string;
}

const CustomerInfo = () => {
  const [formData, setFormData] = useState<CustomerFormData>({
    aadharNumber: '',
    name: '',
    contactNumber: '',
    location: '',
    aadharDocument: null,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, files } = e.target;
    if (name === 'aadharDocument' && files) {
      setFormData((prev) => ({ ...prev, aadharDocument: files[0] }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Aadhar Number Validation (12 digits)
    const aadharRegex = /^\d{12}$/;
    if (!formData.aadharNumber.trim()) {
      newErrors.aadharNumber = 'Aadhar number is required';
    } else if (!aadharRegex.test(formData.aadharNumber)) {
      newErrors.aadharNumber = 'Aadhar number must be a 12-digit number';
    }

    // Name Validation
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    // Contact Number Validation (10 digits)
    const phoneRegex = /^\d{10}$/;
    if (!formData.contactNumber.trim()) {
      newErrors.contactNumber = 'Contact number is required';
    } else if (!phoneRegex.test(formData.contactNumber)) {
      newErrors.contactNumber = 'Contact number must be a 10-digit number';
    }

    // Location Validation
    if (!formData.location.trim()) {
      newErrors.location = 'Location is required';
    }

    // Aadhar Document Validation
    if (!formData.aadharDocument) {
      newErrors.aadharDocument = 'Please upload your Aadhar card document';
    } else if (!['image/jpeg', 'image/png', 'application/pdf'].includes(formData.aadharDocument.type)) {
      newErrors.aadharDocument = 'Document must be a JPEG, PNG, or PDF file';
    }

    // Simulate Aadhar Document Validation (Mock)
    const mockAadharData = {
      name: 'John Doe',
      contactNumber: '9876543210',
    };

    if (formData.name.trim() && formData.name.trim() !== mockAadharData.name) {
      newErrors.name = 'Name does not match the Aadhar document';
    }
    if (formData.contactNumber.trim() && formData.contactNumber.trim() !== mockAadharData.contactNumber) {
      newErrors.contactNumber = 'Contact number does not match the Aadhar document';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (validateForm()) {
      setLoading(true);
      try {
        const formDataToSend = new FormData();
        formDataToSend.append('aadharNumber', formData.aadharNumber);
        formDataToSend.append('name', formData.name);
        formDataToSend.append('contactNumber', formData.contactNumber);
        formDataToSend.append('location', formData.location);
        if (formData.aadharDocument) {
          formDataToSend.append('aadharDocument', formData.aadharDocument);
        }

        const response: AxiosResponse<ApiResponse> = await axios.post(
          'http://localhost:5000/api/customer-info',
          formDataToSend,
          {
            headers: { 'Content-Type': 'multipart/form-data' },
            withCredentials: true,
          }
        );

        alert(response.data.message);
        navigate('/dashboard');
      } catch (error) {
        const err = error as AxiosError<ApiResponse>;
        console.error('Error submitting customer info:', err);
        setErrors({ server: err.response?.data?.message || 'Failed to submit customer info' });
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="customer-info-container">
      <div className="customer-info-card">
        <h2>Customer Information</h2>
        <p>Please provide your details to proceed with the rental process</p>

        {errors.server && <div className="error-message">{errors.server}</div>}

        <form onSubmit={handleSubmit} className="customer-info-form">
          <div className="form-group">
            <label htmlFor="aadharNumber">Aadhar Card Number</label>
            <input
              type="text"
              id="aadharNumber"
              name="aadharNumber"
              value={formData.aadharNumber}
              onChange={handleChange}
              className={errors.aadharNumber ? 'error' : ''}
              placeholder="Enter 12-digit Aadhar number"
            />
            {errors.aadharNumber && <span className="error-message">{errors.aadharNumber}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="name">Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={errors.name ? 'error' : ''}
              placeholder="Enter your full name"
            />
            {errors.name && <span className="error-message">{errors.name}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="contactNumber">Contact Number</label>
            <input
              type="tel"
              id="contactNumber"
              name="contactNumber"
              value={formData.contactNumber}
              onChange={handleChange}
              className={errors.contactNumber ? 'error' : ''}
              placeholder="Enter 10-digit contact number"
            />
            {errors.contactNumber && <span className="error-message">{errors.contactNumber}</span>}
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
              placeholder="Enter your city, state"
            />
            {errors.location && <span className="error-message">{errors.location}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="aadharDocument">Upload Aadhar Card Document</label>
            <input
              type="file"
              id="aadharDocument"
              name="aadharDocument"
              onChange={handleChange}
              className={errors.aadharDocument ? 'error' : ''}
              accept="image/jpeg,image/png,application/pdf"
            />
            {errors.aadharDocument && <span className="error-message">{errors.aadharDocument}</span>}
          </div>

          <button type="submit" className="submit-button" disabled={loading}>
            {loading ? 'Submitting...' : 'Submit Details'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CustomerInfo;