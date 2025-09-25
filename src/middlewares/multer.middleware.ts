import multer from "multer";

const upload = multer({
    limits: {
        fileSize: 1024 * 1024 * 256 // 256MB
    }
});

export default upload;
