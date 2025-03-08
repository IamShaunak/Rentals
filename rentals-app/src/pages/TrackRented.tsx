import React, { useState } from 'react';
import { Activity, Drum, Guitar, Piano, Settings, Package } from 'lucide-react';

const TrackRented = () => {
  // Sample data - in a real application, this would come from your API
  const [rentalData, setRentalData] = useState([
    { id: 1, category: 'drums', totalItems: 24, rentedItems: 18, icon: Drum },
    { id: 2, category: 'guitars', totalItems: 42, rentedItems: 31, icon: Guitar },
    { id: 3, category: 'keyboard', totalItems: 16, rentedItems: 12, icon: Piano },
    { id: 4, category: 'equipment', totalItems: 53, rentedItems: 27, icon: Settings },
    { id: 5, category: 'other', totalItems: 12, rentedItems: 5, icon: Package }
  ]);

  // Calculate totals
  const totalItems = rentalData.reduce((sum, item) => sum + item.totalItems, 0);
  const totalRented = rentalData.reduce((sum, item) => sum + item.rentedItems, 0);
  
  // Get percentage rented
  const percentRented = Math.round((totalRented / totalItems) * 100);

  return (
    <div className="bg-gray-50 min-h-screen p-6">
      <header className="mb-8">
      <h1 className="text-3xl font-bold text-blue-500">Rental Dashboard</h1>
              <p className="text-gray-600">Welcome back! Here's an overview of your rental inventory.</p>
      </header>
      
      {/* Summary Card */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex items-center mb-4">
          <Activity className="h-6 w-6 text-blue-500 mr-2" />
          <h2 className="text-xl font-bold">Rental Summary</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-blue-700 text-sm font-medium">Total Inventory</p>
            <p className="text-3xl font-bold">{totalItems}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <p className="text-green-700 text-sm font-medium">Currently Rented</p>
            <p className="text-3xl font-bold">{totalRented}</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <p className="text-purple-700 text-sm font-medium">Utilization Rate</p>
            <p className="text-3xl font-bold">{percentRented}%</p>
          </div>
        </div>
      </div>
      
      {/* Category Cards */}
      <h2 className="text-xl font-bold mb-4">Categories</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rentalData.map((category) => {
          const CategoryIcon = category.icon;
          const availableItems = category.totalItems - category.rentedItems;
          const utilization = Math.round((category.rentedItems / category.totalItems) * 100);
          
          return (
            <div key={category.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <CategoryIcon className="h-6 w-6 text-blue-500 mr-2" />
                  <h3 className="text-lg font-semibold capitalize">{category.category}</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-600 text-sm">Total</p>
                    <p className="text-2xl font-bold">{category.totalItems}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm">Rented</p>
                    <p className="text-2xl font-bold">{category.rentedItems}</p>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-6 py-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 text-sm">{availableItems} available</span>
                  <span className="text-blue-600 text-sm font-medium">{utilization}% utilization</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full" 
                    style={{ width: `${utilization}%` }}
                  ></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TrackRented;