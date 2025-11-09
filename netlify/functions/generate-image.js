// Netlify Function for image generation
const fetch = require('node-fetch');

// Simple in-memory rate limiting
const limits = new Map();
function checkRateLimit(ip) {
  const now = Date.now();
  const windowMs = 5 * 60 * 1000; // 5 minutes
  const maxRequests = 100;
  
  if (!limits.has(ip)) {
    limits.set(ip, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  const record = limits.get(ip);
  if (now > record.resetTime) {
    limits.set(ip, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (record.count >= maxRequests) {
    return false;
  }
  
  record.count++;
  return true;
}

exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  // Only POST allowed
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  // Check rate limit
  const ip = event.headers['x-forwarded-for'] || event.headers['client-ip'] || 'unknown';
  if (!checkRateLimit(ip)) {
    return {
      statusCode: 429,
      headers,
      body: JSON.stringify({ 
        error: 'Too many requests. Please wait a moment and try again.' 
      }),
    };
  }

  try {
    const body = JSON.parse(event.body);
    const { prompt, width, height, model, seed } = body;
    
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Prompt is required and must be a non-empty string' 
        }),
      };
    }

    console.log(`Generating image for prompt: "${prompt.trim()}"`);
    
    // Pollinations AI endpoint
    const encodedPrompt = encodeURIComponent(prompt.trim());
    const w = Number(width) || 512;
    const h = Number(height) || 512;
    const mdl = (model && typeof model === 'string') ? model : 'flux';
    const sd = (typeof seed === 'number' && !Number.isNaN(seed)) ? seed : Math.floor(Math.random() * 1_000_000);
    const cacheBust = Date.now();
    const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${w}&height=${h}&model=${encodeURIComponent(mdl)}&enhance=true&seed=${sd}&_=${cacheBust}`;
    
    console.log(`Using Pollinations AI: ${pollinationsUrl}`);
    
    try {
      const response = await fetch(pollinationsUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'AI-Image-Generator/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`Pollinations API failed with status: ${response.status}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const base64Data = buffer.toString('base64');
      const imageUrl = `data:image/jpeg;base64,${base64Data}`;
      
      console.log('Image generated successfully with Pollinations AI');
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          success: true, 
          imageUrl: imageUrl,
          prompt: prompt.trim(),
          model: 'Pollinations AI (Flux)'
        }),
      };
      
    } catch (error) {
      console.log('Pollinations API failed, trying backup method...');
      
      // Backup endpoint
      const backupUrl = `https://pollinations.ai/p/${encodedPrompt}?width=${w}&height=${h}&seed=${sd}&_=${cacheBust}`;
      
      try {
        const backupResponse = await fetch(backupUrl, {
          method: 'GET',
          headers: {
            'User-Agent': 'AI-Image-Generator/1.0'
          }
        });

        if (backupResponse.ok) {
          const arrayBuffer = await backupResponse.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          const base64Data = buffer.toString('base64');
          const imageUrl = `data:image/jpeg;base64,${base64Data}`;
          
          console.log('Image generated successfully with backup endpoint');
          
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ 
              success: true, 
              imageUrl: imageUrl,
              prompt: prompt.trim(),
              model: 'Pollinations AI (Backup)'
            }),
          };
        }
      } catch (backupError) {
        console.log('Backup endpoint also failed:', backupError.message);
      }
      
      throw new Error(`Image generation failed: ${error.message}`);
    }
    
  } catch (error) {
    console.error('Function error:', error);
    
    let errorMessage = 'Failed to generate image. ';
    
    if (error.message.includes('Rate limit') || error.message.includes('429')) {
      errorMessage += 'Rate limit exceeded. Please wait 2-3 minutes and try again.';
    } else if (error.message.includes('503') || error.message.includes('loading')) {
      errorMessage += 'Models are loading. Please wait 30-60 seconds and try again.';
    } else if (error.message.includes('timeout') || error.message.includes('ECONNRESET')) {
      errorMessage += 'Connection timeout. Please check your internet and try again.';
    } else {
      errorMessage += 'Please try again or use a shorter prompt.';
    }
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: errorMessage,
        details: error.message
      }),
    };
  }
};
