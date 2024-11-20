import React, { useState, useEffect } from 'react';
import './LoginPage.css';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);  // Manage user data (name, email)
  const navigate = useNavigate();

  // Load user data from localStorage when the component mounts (i.e., no page refresh)
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser)); // Parse the JSON string to an object
    }
  }, []);
  

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
  
    try {
      const response = await axios.post('http://localhost:5000/api/login', {
        email,
        password,
      });
  
      const { token, user } = response.data; // Extract token and user
  
      // Store token and user data in localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user)); // Save user details
  
      setUser(user); // Update user state with actual data
      navigate('/');
    } catch (err) {
      console.error('Login error:', err.response ? err.response.data.message : err.message);
      setError(err.response ? err.response.data.message : 'Invalid credentials');
    }
  };
  
  const handleLogout = () => {
    // Clear user data and token from localStorage
    localStorage.removeItem('token');
    setUser(null); // Clear user state
    navigate('/login'); // Redirect to login page without refreshing
  };

  return (
    <div className="login-page">
      <h2>{user ? 'Logged in' : 'Login'}</h2> {/* Change text based on login status */}
      
      {!user ? (
        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit">Login</button>
          {error && <p style={{ color: 'red' }}>{error}</p>}
        </form>
      ) : (
        <div>
          <p>Welcome, {user.name}</p> {/* Display actual user's name */}
          <p>Email: {user.email}</p> {/* Display actual user's email */}
          <button onClick={handleLogout}>Logout</button>
        </div>
      )}
    </div>
  );
};

export default LoginPage;
