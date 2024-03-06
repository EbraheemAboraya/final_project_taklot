require('dotenv').config();
const express = require('express');
const userRout = require('./router/usersRouter/users');
const rqeRout = require('./router/requestsRouter/request');
const TechRout = require('./router/technicalRouter/technical');
const offerRout = require('./router/offerRouter/offer');
const homeRout = require('./router/homePageRouter/home');
const feedbackRout = require('./router/feedbackRouter/feedback');
const singupRout = require('./router/signup/signup');
const uploadImageRouter = require('./router/flaskApiRouter/uploadImageRouter');
const path = require('path');
const http = require('http');
const app = express();
const morgan = require("morgan"); // Logging middleware




// Create an HTTP server
const server = http.createServer(app);

// Initialize Socket.IO with the server
const ioInit = require('./io').init(server);

app.set('view engine', 'ejs');
const { connectDB } = require('./db/dbconnect');



// Constants
const port = process.env.PORT || 8000;


app.use(express.static(path.join(__dirname, 'public')));
// app.use(express.json());
app.use(morgan("dev")); // Use morgan for logging

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Routes
app.use(userRout);
app.use(rqeRout);
app.use(TechRout);
app.use(offerRout);
app.use(feedbackRout);
app.use(homeRout);
app.use(singupRout);
app.use('/api', uploadImageRouter); // Use the new upload image router under the '/api' path

// Connect to DB
connectDB();



server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/login`);
  require('./io').init(server);
});

// Export the app and server for testing purposes (if needed)
module.exports = { app, server };
