const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/authMiddleware');
const upload = require('../config/multerConfig');
const { submitForm, updateForm, getProfile, deleteApplication, deleteAccount } = require('../controllers/formController');

router.post('/submit', verifyToken, upload.single('photo'), submitForm);
router.put('/update', verifyToken, upload.single('photo'), updateForm);
router.get('/profile', verifyToken, getProfile);
router.delete('/application', verifyToken, deleteApplication);
router.delete('/account', verifyToken, deleteAccount);

module.exports = router;