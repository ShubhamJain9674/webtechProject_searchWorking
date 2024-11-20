import React from 'react';

// ProductList component to display product details
const ProductList = ({ products }) => {
  return (
    <div className="product-list">
      {products.map((product, index) => (
        <div key={index} className="product-item">
          <div className="product-details">
            <h3>{product['Product Name']}</h3>
            <p>Price: ₹{product['Price']}</p>
            <p>Last Modified: {product['Last Modified']}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProductList;
