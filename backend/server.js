const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
const cors = require('cors');
const axios = require('axios'); // For external API requests, if needed
const fs = require('fs');
const { exec } = require('child_process');

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// Middleware to parse incoming JSON requests
app.use(express.json());
app.use(cors());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Create User Schema and Model
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

const User = mongoose.model('User', userSchema);

// Create Feedback Schema and Model
const feedbackSchema = new mongoose.Schema({
  name: { type: String, required: true },
  feedback: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const Feedback = mongoose.model('Feedback', feedbackSchema);

// Register User Endpoint
app.post('/api/register', async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ name, email, password: hashedPassword });
    await newUser.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    console.error('Error registering user:', err);
    res.status(500).json({ message: 'Something went wrong. Please try again later.' });
  }
});

// Login User Endpoint
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    // Return token along with user details
    res.status(200).json({
      message: 'Login successful',
      token,
      user: { name: user.name, email: user.email },
    });
  } catch (err) {
    console.error('Error logging in:', err);
    res.status(500).json({ message: 'Something went wrong. Please try again later.' });
  }
});

// Get User Details Endpoint
app.get('/api/user/me', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ name: user.name, email: user.email });
  } catch (err) {
    console.error('Error fetching user data:', err);
    res.status(500).json({ message: 'Something went wrong' });
  }
});

// Product Search Endpoint
app.get('/api/search', async (req, res) => {
  const keyword = req.query.keyword;
  if (!keyword) {
    return res.status(400).json({ message: 'Keyword is required' });
  }

  try {
    const mockProducts = [
      { name: 'Product 1', price: '100', description: 'Description 1' },
      { name: 'Product 2', price: '200', description: 'Description 2' },
      { name: 'Product 3', price: '300', description: 'Description 3' },
    ];

    const filteredProducts = mockProducts.filter((product) =>
      product.name.toLowerCase().includes(keyword.toLowerCase())
    );

    res.json({ products: filteredProducts });
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).json({ message: 'Failed to fetch products' });
  }
});

// Feedback Endpoint
app.post('/api/feedback', async (req, res) => {
  const { name, feedback } = req.body;

  if (!name || !feedback) {
    return res.status(400).json({ message: 'Name and feedback are required.' });
  }

  try {
    const newFeedback = new Feedback({
      name,
      feedback,
    });

    await newFeedback.save();

    let transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    let mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.FEEDBACK_EMAIL,
      subject: 'New Feedback from Website',
      text: `Feedback received from ${name}:\n\n${feedback}`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Error sending feedback email:', error);
      } else {
        console.log('Feedback email sent:', info.response);
      }
    });

    res.status(200).json({ message: 'Feedback received and saved successfully!' });
  } catch (err) {
    console.error('Error saving feedback:', err);
    res.status(500).json({ message: 'Error saving feedback. Please try again later.' });
  }
});

// // Save Keyword and Trigger Python Script


// app.post('/api/save-keyword', async (req, res) => {
//   const { keyword } = req.body;

//   if (!keyword) {
//     return res.status(400).json({ error: 'Keyword is required' });
//   }

//   const filePath = './keyword.txt';

//   try {
//     // Save keyword to a file for the Python script
//     fs.writeFileSync(filePath, keyword, 'utf8');

//     // Execute the Python script
//     exec('python ./search_product.py', (error, stdout, stderr) => {
//       if (error) {
//         console.error(`Error executing script: ${error.message}`);
//         return res.status(500).json({ error: 'Failed to run Python script.' });
//       }

//       if (stderr) {
//         console.error(`Python script error: ${stderr}`);
//         return res.status(500).json({ error: `Python script error: ${stderr}` });
//       }

//       console.log(`Script output: ${stdout}`);

//       // Read the product information from the text file
//       fs.readFile('./product_info.txt', 'utf8', (err, data) => {
//         if (err) {
//           console.error('Error reading product info file:', err);
//           return res.status(500).json({ error: 'Failed to read product info file.' });
//         }

//         // Respond with the product data read from the text file
//         res.status(200).json({
//           message: 'Keyword saved, script executed, and product fetched successfully.',
//           productInfo: data
//         });
//       });
//     });
//   } catch (err) {
//     console.error('Error saving keyword or running script:', err);
//     return res.status(500).json({ error: 'Failed to save keyword or execute script.' });
//   }
// });


// const fs = require('fs');
// const { exec } = require('child_process');

app.post('/api/save-keyword', async (req, res) => {
  const { keyword } = req.body;

  if (!keyword) {
    return res.status(400).json({ error: 'Keyword is required' });
  }

  const filePath = './keyword.txt';

  try {
    // Save keyword to a file for the Python script
    fs.writeFileSync(filePath, keyword, 'utf8');

    // Execute the Python script
    exec('python ./search_product.py', (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing script: ${error.message}`);
        return res.status(500).json({ error: 'Failed to run Python script.' });
      }

      if (stderr) {
        console.error(`Python script error: ${stderr}`);
        return res.status(500).json({ error: `Python script error: ${stderr}` });
      }

      console.log(`Script output: ${stdout}`);

      // Read the product information from the text file
      fs.readFile('./product_info.txt', 'utf8', (err, data) => {
        if (err) {
          console.error('Error reading product info file:', err);
          return res.status(500).json({ error: 'Failed to read product info file.' });
        }

        // Respond with the product data read from the text file
        res.status(200).json({
          message: 'Keyword saved, script executed, and product fetched successfully.',
          productInfo: data
        });
      });
    });
  } catch (err) {
    console.error('Error saving keyword or running script:', err);
    return res.status(500).json({ error: 'Failed to save keyword or execute script.' });
  }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
