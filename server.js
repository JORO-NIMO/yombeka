const express = require('express');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Ensure fetch is available in Node environments < 18
let fetchFn = global.fetch;
if (!fetchFn) {
  try {
    fetchFn = require('node-fetch');
  } catch (e) {
    console.warn('node-fetch is not installed. Install it with "npm i node-fetch" or use Node 18+ which provides global fetch.');
  }
}

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json());
//app.use(express.static('.'));
app.use(express.static(path.join(__dirname, 'public')));

// Rate limiting: protect API from abuse (e.g., 1000 requests per 5 minutes per IP)
const apiLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 1000, // limit each IP to requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests. Please wait a moment and try again.',
  },
});
app.use('/api/', apiLimiter);

// Serve the main HTML file
app.get('/', (req, res) => {
    // Serve the app entry from public (or your build output)
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Image generation endpoint using Hugging Face Stable Diffusion (FREE)
app.post('/api/generate-image', async (req, res) => {
    try {
        const { prompt, width, height, model, seed } = req.body;
        
        if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
            return res.status(400).json({ 
                error: 'command is required and must be a non-empty string' 
            });
        }

        // Using Pollinations AI - completely free, no API key needed!
        console.log(`Generating image for prompt: "${prompt.trim()}"`);
        
        // Pollinations AI endpoint - encode prompt for URL
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

            // Get the image as blob
            // Some fetch implementations in Node do not support blob(); use arrayBuffer directly when needed
            const arrayBuffer = response.arrayBuffer ? await response.arrayBuffer() : await (await response.blob()).arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const base64Data = buffer.toString('base64');
            const imageUrl = `data:image/jpeg;base64,${base64Data}`;
            
            console.log('Image generated successfully with Pollinations AI');
            
            return res.json({ 
                success: true, 
                imageUrl: imageUrl,
                prompt: prompt.trim(),
                model: 'Pollinations AI (Flux)'
            });
            
        } catch (error) {
            console.log('Pollinations API failed, trying backup method...');
            
            // Backup: Try a different Pollinations endpoint
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
                    
                    console.log('Image generated successfully with backup Pollinations endpoint');
                    
                    return res.json({ 
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
        
        // Provide helpful error messages
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
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📝 API endpoint: http://localhost:${PORT}/api/generate-image`);
    console.log(`🏥 Health check: http://localhost:${PORT}/api/health`);
});
