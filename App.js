const express = require('express');
const session = require('express-session');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const TOKEN_EXPIRATION_TIME = 5 * 1000; // 300 seconds in milliseconds

// Middleware setup
app.use(express.urlencoded({ extended: true }));
app.use(express.json()); // Ensure that JSON body parsing is enabled
app.use(session({
    secret: 'b7e5aeb3d7c1b8f6f27b2a9e9fca5c1c92d4f6f8a57e45a2c1e4d8f6c7b89a7d', // Change this to a more secure, random key
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Set secure: true if using HTTPS
}));

// Serve static files from 'client/public' directory
app.use(express.static(path.join(__dirname, 'client', 'public')));

// In-memory token store with expiration
const validTokens = new Map(); // Map to store token with creation time

// Serve the login page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'client', 'public', 'login', 'index.html'));
});

// Handle login form submission
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    // Replace this with your actual authentication logic
    if (username === 'admin' && password === 'pass') {
        const token = uuidv4();
        const creationTime = Date.now(); // Store the creation time of the token
        req.session.token = token; // Set session token
        validTokens.set(token, creationTime); // Store token with its creation time
        console.log(`Generated token: ${token}`); // Debug statement
        res.redirect(`/b7e5aeb3d7c1b8f6f27b2a9e9?token=${token}`);
    } else {
        res.redirect('/?error=invalid_credentials');
    }
});

// Serve files from the admin directory using token validation
app.get('/b7e5aeb3d7c1b8f6f27b2a9e9/*', (req, res) => {
    const token = req.query.token; // Token is expected as a query parameter
    const filePath = path.join(__dirname, 'client', 'public', 'b7e5aeb3d7c1b8f6f27b2a9e9', req.params[0]);

    console.log(`Requesting file with token: ${token}`); // Debug statement

    if (validTokens.has(token)) {
        const creationTime = validTokens.get(token);
        const currentTime = Date.now();

        if (currentTime - creationTime <= TOKEN_EXPIRATION_TIME) {
            validTokens.delete(token); // Invalidate the token after use
            if (fs.existsSync(filePath)) {
                res.sendFile(filePath);
            } else {
                res.status(404).send('File not found');
            }
        } else {
            console.log(`Token ${token} has expired`); // Debug statement
            validTokens.delete(token); // Remove expired token
            res.redirect('/');
        }
    } else {
        console.log(`Token ${token} is invalid`); // Debug statement
        res.redirect('/');
    }
});

// Serve admin page or assets
app.use('/b7e5aeb3d7c1b8f6f27b2a9e9', (req, res) => {
    const token = req.query.token; // Extract token from query parameters
    if (validTokens.has(token)) {
        const creationTime = validTokens.get(token);
        const currentTime = Date.now();

        if (currentTime - creationTime <= TOKEN_EXPIRATION_TIME) {
            // Serve the admin page or asset if the token is valid
            res.sendFile(path.join(__dirname, 'client', 'public', 'b7e5aeb3d7c1b8f6f27b2a9e9', 'index.html'));
        } else {
            console.log(`Token ${token} has expired`); // Debug statement
            validTokens.delete(token); // Remove expired token
            res.redirect('/');
        }
    } else {
        // Redirect to login page if no valid token
        res.redirect('/');
    }
});

// Handle undefined routes, redirect to login page
app.use((req, res) => {
    res.redirect('/'); // Redirect any undefined routes to login page
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
