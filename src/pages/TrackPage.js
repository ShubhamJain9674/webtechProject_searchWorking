import React, { useState } from 'react';
import PriceTrackerForm from '../comp/PriceTrackerForm';
import ProductList from '../comp/ProductList';
//import './track.css'

const TrackPage = () => {
  const [products, setProducts] = useState([]);

  const handleTrack = (url) => {
    // Mock data to simulate backend response
    const mockProduct = {
      id: Date.now(),
      name: "Sample Product",
      price: (Math.random() * 100).toFixed(2),
      image: "https://via.placeholder.com/150",
      link: url,
    };
    setProducts([...products, mockProduct]);
  };

  return (
    <div className="track-page">
      <h2>Track Product Prices</h2>
      <PriceTrackerForm onSubmit={handleTrack} />
      <ProductList products={products} />
    </div>
  );
};

export default TrackPage;
