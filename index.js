//Server
const express = require('express');
const app = express();
const port = process.env.PORT || 5000;

//Middleware
const cors = require('cors');
const morgan = require('morgan');

//Routes
const uploadRoute = require('./routes/upload/upload');

//Initialise middleware
app.use(cors(), morgan('dev'));

//API
app.use('/upload', uploadRoute);

// Log server listening
app.listen(port, () => {
  console.log(`Server listening on port ${port}...`);
});
