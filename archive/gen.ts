import React, { useState } from 'react';
import { Loader2, Image } from 'lucide-react';

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
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4 font-inter">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg w-full max-w-2xl text-center">
        <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">Image Generator</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Enter a prompt to generate an image.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <input
            type="text"
            className="flex-grow p-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500"
            placeholder="A futuristic city in the style of a watercolor painting"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={isLoading}
          />
          <button
            onClick={generateImage}
            className="bg-blue-600 text-white p-3 rounded-lg font-semibold shadow-md hover:bg-blue-700 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!prompt || isLoading}
          >
            {isLoading ? (
              <Loader2 size={24} className="animate-spin" />
            ) : (
              'Generate Image'
            )}
          </button>
        </div>

        {/* Display area for image, loading, or error messages */}
        <div className="mt-8">
          {isLoading && (
            <div className="flex flex-col items-center justify-center p-12 bg-gray-200 dark:bg-gray-700 rounded-lg">
              <Loader2 size={48} className="animate-spin text-blue-600 mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Generating image...</p>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded-lg">
              <p>{error}</p>
            </div>
          )}

          {imageUrl && !isLoading && (
            <div className="p-2 bg-gray-200 dark:bg-gray-700 rounded-lg">
              <img
                src={imageUrl}
                alt="Generated from prompt"
                className="w-full h-auto rounded-lg"
              />
            </div>
          )}

          {!imageUrl && !isLoading && !error && (
            <div className="flex flex-col items-center justify-center p-12 bg-gray-200 dark:bg-gray-700 rounded-lg text-gray-500 dark:text-gray-400">
              <Image size={48} className="mb-4" />
              <p>Your generated image will appear here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
