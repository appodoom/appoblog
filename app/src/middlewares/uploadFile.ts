import multer from "multer";

export const uploadMiddleware = (
  uploadDir = "./uploads",
  maxSize = 100 * 1024 * 1024
) => {
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
      cb(null, file.originalname);
    },
  });

  return multer({
    storage: storage,
    limits: { fileSize: maxSize },
  });
};
