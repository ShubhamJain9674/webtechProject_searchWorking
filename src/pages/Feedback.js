import React, { useState } from 'react';
import './FeedbackPage.css';

const FeedbackPage = () => {
  const [name, setName] = useState('');
  const [feedback, setFeedback] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate the inputs
    if (!name || !feedback) {
      setMessage('Both name and feedback are required.');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, feedback }),
      });

      const data = await response.json();
      if (response.status === 200) {
        setMessage('Thank you for your valuable feedback!');
      } else {
        setMessage('Failed to send feedback. Please try again later.');
      }
    } catch (error) {
      setMessage('Failed to send feedback. Please try again later.');
      console.error('Error submitting feedback:', error);
    }

    setName('');
    setFeedback('');
  };

  return (
    <div className="feedback-page">
      <h2>Feedback</h2>
      <form onSubmit={handleSubmit}>
        <input 
          type="text"
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          id="NameInput"
        />
        <textarea
          placeholder="We value your feedback"
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          required
        ></textarea>
        <button type="submit">Submit</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
};

export default FeedbackPage;
