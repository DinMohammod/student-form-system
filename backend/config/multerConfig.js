const multer = require('multer');
const path = require('path');

// ফাইল কোথায়, কী নামে Save হবে তা ঠিক করা
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // uploads Folder-এ Save হবে
    },
    filename: function (req, file, cb) {
        // Unique নাম তৈরি করা: user_id + Timestamp + Original Extension
        const uniqueName = req.user.user_id + '-' + Date.now() + path.extname(file.originalname);
        cb(null, uniqueName);
    }
});

// শুধু Image File Accept করা (Security-এর জন্য)
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only JPG/PNG images can be uploaded.'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // Maximum 5MB
});

module.exports = upload;