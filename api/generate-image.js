// Vercel Serverless Function for image generation
const rateLimit = require('express-rate-limit');

// Ensure fetch is available
let fetchFn = global.fetch;
if (!fetchFn) {
  try {
    fetchFn = require('node-fetch');
  } catch (e) {
    console.warn('node-fetch is not installed.');
  }
}

// Rate limiting helper
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

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only POST allowed
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check rate limit
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  if (!checkRateLimit(ip)) {
    return res.status(429).json({ 
      error: 'Too many requests. Please wait a moment and try again.' 
    });
  }

  try {
    const { prompt, width, height, model, seed } = req.body;
    
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return res.status(400).json({ 
        error: 'Prompt is required and must be a non-empty string' 
      });
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
      const response = await fetchFn(pollinationsUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'AI-Image-Generator/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`Pollinations API failed with status: ${response.status}`);
      }

      const arrayBuffer = response.arrayBuffer ? await response.arrayBuffer() : await (await response.blob()).arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const base64Data = buffer.toString('base64');
      const imageUrl = `data:image/jpeg;base64,${base64Data}`;
      
      console.log('Image generated successfully with Pollinations AI');
      
      return res.status(200).json({ 
        success: true, 
        imageUrl: imageUrl,
        prompt: prompt.trim(),
        model: 'Pollinations AI (Flux)'
      });
      
    } catch (error) {
      console.log('Pollinations API failed, trying backup method...');
      
      // Backup endpoint
      const backupUrl = `https://pollinations.ai/p/${encodedPrompt}?width=${w}&height=${h}&seed=${sd}&_=${cacheBust}`;
      
      try {
        const backupResponse = await fetchFn(backupUrl, {
          method: 'GET',
          headers: {
            'User-Agent': 'AI-Image-Generator/1.0'
          }
        });

        if (backupResponse.ok) {
          const arrayBuffer = backupResponse.arrayBuffer ? await backupResponse.arrayBuffer() : await (await backupResponse.blob()).arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          const base64Data = buffer.toString('base64');
          const imageUrl = `data:image/jpeg;base64,${base64Data}`;
          
          console.log('Image generated successfully with backup endpoint');
          
          return res.status(200).json({ 
            success: true, 
            imageUrl: imageUrl,
            prompt: prompt.trim(),
            model: 'Pollinations AI (Backup)'
          });
        }
      } catch (backupError) {
        console.log('Backup endpoint also failed:', backupError.message);
      }
      
      throw new Error(`Image generation failed: ${error.message}`);
    }
    
  } catch (error) {
    console.error('Server error:', error);
    
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
    
    return res.status(500).json({ 
      error: errorMessage,
      details: error.message
    });
  }
};
