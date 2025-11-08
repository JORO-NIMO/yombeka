const express = require('express');
const { detectNodeOrFetch } = require('../scripts/detect-node-or-fetch');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware setup
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize fetch
detectNodeOrFetch();

// Import routes
const routes = require('./routes/index');
app.use('/api', routes);

// Serve static files from the public directory
app.use(express.static('public'));

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});