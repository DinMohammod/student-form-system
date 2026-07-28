const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const pool = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const formRoutes = require('./routes/formRoutes');
const adminRoutes = require('./routes/adminRoutes');
const connectMongoDB = require('./config/mongoDB');
const { testMySQLConnection } = require('./config/mysqlDB');


const app = express();

connectMongoDB();
testMySQLConnection();


app.use(cors());
app.use(express.json());

// uploads Folder-কে Publicly Accessible করা (Photo দেখার জন্য)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/', (req, res) => {
    res.send('Server is Running');
});

app.use('/api/auth', authRoutes);
app.use('/api/form', formRoutes);
app.use('/api/admin', adminRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});