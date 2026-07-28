const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/adminMiddleware');
const { getAllUsers, getUserProfile, getUserHistory } = require('../controllers/adminController');

router.get('/users', verifyToken, isAdmin, getAllUsers);
router.get('/users/:id/profile', verifyToken, isAdmin, getUserProfile);
router.get('/users/:id/history', verifyToken, isAdmin, getUserHistory);

module.exports = router;