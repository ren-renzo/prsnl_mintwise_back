//API FRAMEWORK
const express = require('express');
//CROSS ORIGIN RESOURCE SHARING
const cors = require('cors');
//ENVIRONMENT VARIABLES
require ('dotenv').config();
//DATABASE CONNECTION
const db = require('./config/db.js');

//ROUTES
const routes = require('./routes/index.js')

//UTILIZATION IOF EXPRESS
const allowedOrigins = [
  'mintwis3.netlify.app'
];

const corsOptions = {
  origin: function (origin, callback) {
    
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
};





const app = express();
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//USE ROUTES
app.use('/api', routes)

app.listen(process.env.PORT, () => {
    console.log(`Server is runnimg on Port ${process.env.PORT}`)

})

