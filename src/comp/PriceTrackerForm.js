import React, { useState } from 'react';
import ProductList from './ProductList'; // Import the ProductList component

const PriceTrackerForm = () => {
  const [keyword, setKeyword] = useState('');
  const [message, setMessage] = useState('');
  const [products, setProducts] = useState([]); // State to hold product details

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (keyword) {
      try {
        // Send the keyword to the backend
        const response = await fetch('http://localhost:5000/api/save-keyword', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ keyword }),
        });

        const result = await response.json();
        console.log('Fetched product info:', result.productInfo); // Log the fetched product info

        if (response.ok) {
          setMessage(result.message);
          // Parse the text file data into product details and set it in state
          const productInfo = result.productInfo.split('\n').reduce((acc, line) => {
            const [key, value] = line.split(':');
            if (key && value) {
              acc[key.trim()] = value.trim();
            }
            return acc;
          }, {});
          setProducts([productInfo]); // Store product info in state as an array of product objects
        } else {
          setMessage(result.error || 'Failed to save keyword.');
        }
        setKeyword(''); // Reset the keyword field
      } catch (error) {
        setMessage('Error occurred while saving the keyword.');
        console.error(error);
      }
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Enter Product Keyword"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          required
        />
        <button type="submit">Track Product</button>
      </form>
      {message && <p>{message}</p>}
      {/* Display the ProductList component if there are products */}
      {products.length > 0 && <ProductList products={products} />}
    </div>
  );
};

export default PriceTrackerForm;
