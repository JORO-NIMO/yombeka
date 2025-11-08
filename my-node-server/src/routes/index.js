import express from 'express';

const router = express.Router();

// Define your routes here
router.get('/', (req, res) => {
    res.send('Welcome to the API!');
});

// Export the router to be used in app.js
export default router;