import React from 'react';
import './ProductCard.css';

const ProductCard = ({ product }) => {
  return (
    <div className="product-card">
      <img src={product.image} alt={product.name} />
      <h3>{product.name}</h3>
      <p>Price: ${product.price}</p>
      <a href={product.link} target="_blank" rel="noopener noreferrer">View on Amazon</a>
    </div>
  );
};

export default ProductCard;
