import React, { useState } from 'react';
import { Loader2, Image } from 'lucide-react';
import './App.css';

const App = () => {
  const [prompt, setPrompt] = useState('');
  const [imageUrl, setImageUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Function to generate the image using the Imagen API
  const generateImage = async () => {
    // Clear previous image and error
    setImageUrl(null);
    setError(null);
    setIsLoading(true);

    // API configuration and payload
    const payload = {
      instances: { prompt: prompt },
      parameters: { "sampleCount": 1 }
    };
    
    const apiKey = process.env.REACT_APP_API_KEY;
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${apiKey}`;

    // Implementing exponential backoff for API calls
    const maxRetries = 5;
    let retryCount = 0;
    
    while (retryCount < maxRetries) {
      try {
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          throw new Error(`API call failed with status: ${response.status}`);
        }

        const result = await response.json();
        
        // Check for the expected response structure
        if (result.predictions && result.predictions.length > 0 && result.predictions[0].bytesBase64Encoded) {
          const base64Data = result.predictions[0].bytesBase64Encoded;
          const url = `data:image/png;base64,${base64Data}`;
          setImageUrl(url);
          break; // Exit the loop on success
        } else {
          throw new Error('Unexpected API response structure.');
        }
      } catch (e) {
        if (e.message.includes('API call failed with status: 429') && retryCount < maxRetries - 1) {
          // Handle rate limiting with exponential backoff
          const delay = Math.pow(2, retryCount) * 1000 + Math.random() * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
          retryCount++;
          console.log(`Retrying API call... attempt ${retryCount}`);
        } else {
          console.error('Error generating image:', e);
          setError('Failed to generate image. Please try a different prompt.');
          break; // Exit the loop on non-recoverable error
        }
      }
    }

    setIsLoading(false);
  };

  return (
    <div className="app-container">
      <div className="app-card">
        <h1 className="app-title">Image Generator</h1>
        <p className="app-description">
          Enter a prompt to generate an image.
        </p>
        <div className="input-container">
          <input
            type="text"
            className="prompt-input"
            placeholder="A futuristic city in the style of a watercolor painting"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={isLoading}
          />
          <button
            onClick={generateImage}
            className="generate-button"
            disabled={!prompt || isLoading}
          >
            {isLoading ? (
              <Loader2 size={24} className="spinner" />
            ) : (
              'Generate Image'
            )}
          </button>
        </div>

        {/* Display area for image, loading, or error messages */}
        <div className="result-container">
          {isLoading && (
            <div className="loading-container">
              <Loader2 size={48} className="spinner large" />
              <p>Generating image...</p>
            </div>
          )}

          {error && (
            <div className="error-container">
              <p>{error}</p>
            </div>
          )}

          {imageUrl && !isLoading && (
            <div className="image-container">
              <img
                src={imageUrl}
                alt="Generated from prompt"
                className="generated-image"
              />
            </div>
          )}

          {!imageUrl && !isLoading && !error && (
            <div className="placeholder-container">
              <Image size={48} className="placeholder-icon" />
              <p>Your generated image will appear here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
