import React, { useState, useEffect, FormEvent } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import axios, { AxiosError } from 'axios';
import './AddItemPage.css';

interface ApiResponse {
  message: string;
  rental?: {
    _id: string;
    entityName: string;
    category: string;
    subcategory?: string;
    brand: string;
    modelNumber: string;
    stock: number;
    deliveryStatus: string;
    imagePaths?: string[];
    createdAt: string;
  };
}

interface Rental {
  _id: string;
  entityName: string;
  category: string;
  subcategory?: string;
  brand: string;
  modelNumber: string;
  stock: number;
  deliveryStatus: string;
  imagePaths?: string[];
  createdAt: string;
}

// Define category-brand mappings
const categoryBrands = {
  Drums: ['Brand1', 'Brand2', 'Brand3'],
  Guitar: ['BrandX', 'BrandY', 'BrandZ'],
  Keyboards: ['BrandA', 'BrandB', 'BrandC'],
  Equipments: ['BrandP', 'BrandQ', 'BrandR'],
  Others: ['BrandM', 'BrandN', 'BrandO'],
};

const AddItemPage = () => {
  const [category, setCategory] = useState('Drums');
  const [subcategory, setSubcategory] = useState('');
  const [brand, setBrand] = useState('');
  const [modelNumber, setModelNumber] = useState('');
  const [stock, setStock] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialRental, setInitialRental] = useState<Rental | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');

  // Fetch rental data if in edit mode
  useEffect(() => {
    if (editId) {
      const fetchRental = async () => {
        try {
          setLoading(true);
          const response: AxiosResponse<Rental> = await axios.get(`http://localhost:5000/api/rentals/${editId}`, {
            withCredentials: true,
          });
          const rental = response.data;
          setInitialRental(rental);
          setCategory(rental.category);
          setSubcategory(rental.subcategory || '');
          setBrand(rental.brand);
          setModelNumber(rental.modelNumber);
          setStock(rental.stock.toString());
          setImages([]); // Reset images for new uploads
        } catch (err) {
          const error = err as AxiosError<ApiResponse>;
          setError(error.response?.data?.message || 'Failed to fetch rental details.');
        } finally {
          setLoading(false);
        }
      };
      fetchRental();
    }
  }, [editId]);

  // Dynamically set brand options based on category
  const brandOptions = categoryBrands[category] || [];

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Client-side validation
    if (!category || category === 'Select a category') {
      setError('Please select a valid category');
      return;
    }
    if (category === 'Guitar' && !subcategory) {
      setError('Please select a subcategory for Guitar');
      return;
    }
    if (!modelNumber.trim()) {
      setError('Model number is required');
      return;
    }
    if (!brand) {
      setError('Please select a brand');
      return;
    }
    const stockValue = parseInt(stock);
    if (isNaN(stockValue) || stockValue <= 0) {
      setError('Stock must be a positive number');
      return;
    }

    const formData = new FormData();
    formData.append('category', category);
    if (subcategory) formData.append('subcategory', subcategory);
    formData.append('brand', brand);
    formData.append('modelNumber', modelNumber);
    formData.append('stock', stock);
    images.forEach((image, index) => {
      formData.append('images', image);
    });

    try {
      setLoading(true);
      console.log('Sending request with:', {
        category,
        subcategory,
        brand,
        modelNumber,
        stock,
      });
      if (editId) {
        // Update existing rental
        const response = await axios.put(`http://localhost:5000/api/rentals/${editId}`, formData, {
          withCredentials: true,
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setSuccess(response.data.message);
      } else {
        // Create new rental
        const response = await axios.post('http://localhost:5000/api/rentals', formData, {
          withCredentials: true,
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setSuccess(response.data.message);
      }
      setCategory('Drums');
      setSubcategory('');
      setBrand('');
      setModelNumber('');
      setStock('');
      setImages([]);
      if (editId) navigate('/rented');
    } catch (err) {
      const error = err as AxiosError<ApiResponse>;
      console.log('Error response:', error.response?.data);
      setError(error.response?.data?.message || 'Failed to add item. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const selectedImages = Array.from(files).slice(0, 3); // Limit to 3 images
      setImages(selectedImages);
    }
  };

  return (
    <div className="add-item-page">
      <h1>{editId ? 'Edit Item to Rent Out' : 'Add Item to Rent Out'}</h1>
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Category:</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="Drums">Drums</option>
            <option value="Guitar">Guitar</option>
            <option value="Keyboards">Keyboards</option>
            <option value="Equipments">Equipments</option>
            <option value="Others">Others</option>
          </select>
        </div>
        {category === 'Guitar' && (
          <div className="form-group">
            <label>Subcategory:</label>
            <select value={subcategory} onChange={(e) => setSubcategory(e.target.value)}>
              <option value="">Select a subcategory</option>
              <option value="Acoustic">Acoustic</option>
              <option value="Electric">Electric</option>
            </select>
          </div>
        )}
        <div className="form-group">
          <label>Brand:</label>
          <select value={brand} onChange={(e) => setBrand(e.target.value)}>
            <option value="">Select a brand</option>
            {brandOptions.map((brandOption) => (
              <option key={brandOption} value={brandOption}>
                {brandOption}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Model Number:</label>
          <input
            type="text"
            value={modelNumber}
            onChange={(e) => setModelNumber(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Stock Quantity:</label>
          <input
            type="number"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            required
            min="1"
          />
        </div>
        <div className="form-group">
          <label>Images (up to 3, optional):</label>
          <input
            type="file"
            accept="image/jpeg,image/png"
            onChange={handleImageChange}
            multiple
          />
          {initialRental?.imagePaths && initialRental.imagePaths.length > 0 && (
            <p>Current images: {initialRental.imagePaths.join(', ')}</p>
          )}
          {images.length > 0 && (
            <div>
              <p>Selected images: {images.length}</p>
            </div>
          )}
        </div>
        <button type="submit" disabled={loading}>
          {loading ? 'Submitting...' : editId ? 'Save Changes' : 'Submit'}
        </button>
      </form>
    </div>
  );
};

export default AddItemPage;