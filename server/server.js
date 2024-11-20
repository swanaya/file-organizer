require('dotenv').config();
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const UPLOAD_DIR = process.env.UPLOAD_DIR;

if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR);
}

function ensureDirectoryExistence(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
    }
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const ext = path.extname(file.originalname).substring(1);
        const targetDir = path.join(UPLOAD_DIR, ext);
        ensureDirectoryExistence(targetDir);
        cb(null, targetDir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).substring(1);
        const targetDir = path.join(UPLOAD_DIR, ext);
        const files = fs.readdirSync(targetDir);
        const nextIndex = files.length + 1;
        const newName = `${ext}-${nextIndex}${path.extname(file.originalname)}`;
        cb(null, newName);
    },
});

const allowedFileTypes = new RegExp(
    process.env.ALLOWED_FILE_TYPES.split(',').join('|')
);

const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        const extname = allowedFileTypes.test(
            path.extname(file.originalname).toLowerCase()
        );
        const mimetype = allowedFileTypes.test(file.mimetype);

        if (extname && mimetype) {
            cb(null, true);
        } else {
            cb(new Error('File type not supported'));
        }
    },
}).array('files[]', parseInt(process.env.MAX_FILE_UPLOADS, 10));

app.use(express.static('public'));

app.post('/upload', (req, res) => {
    upload(req, res, (err) => {
        if (err) {
            return res.status(400).json({ message: err.message });
        }
        res.status(200).json({ message: 'Files uploaded and organized successfully' });
    });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
