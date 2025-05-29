const multer = require('multer');
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    // Accept images and videos
    const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif'];
    const allowedVideoTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo'];
    
    if (allowedImageTypes.includes(file.mimetype) || allowedVideoTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only image and video files are allowed!'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    // limits: {
    //     fileSize: 50 * 1024 * 1024 // 50MB max file size for videos
    // }
});

module.exports = upload; 