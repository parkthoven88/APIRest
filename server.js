require('dotenv').config();

const express = require('express');
const app = express();
const path = require('path');
const connectDB = require('./config/dbConn');
const corsOptions = require('./config/corsOptions');
const mongoose = require('mongoose');
const cors = require('cors');
const PORT = process.env.PORT || 3500;

connectDB();

// CORS
app.use(cors(corsOptions));

// middleware
app.use(express.urlencoded({ extended: false }));

// middleware for json
app.use(express.json());

// serve static files
app.use('/', express.static(path.join(__dirname, '/public')));

// routes
app.use('/', require('./routes/root'));

app.use('/states', require('./routes/api/states'));

app.all('*', (req, res) => {
  res.status(404);
  if (req.accepts('html')) {
    res.sendFile(path.join(__dirname, 'views', '404.html'));
  } else if (req.accepts('json')) {
    res.json({ error: '404 Not Found' });
  } else {
    res.type('txt').send('404 Not Found');
  }
});

mongoose.connection.once('open', () => {
  console.log('Connected to MongoDB');
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});
