const util = require("util");
const multer = require("multer");

function createUploadMiddleware(dest, fieldName) {
  let storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, dest);
    },
    filename: (req, file, cb) => {
      cb(null, `${Date.now()}-${file.originalname}`);
    },
  });

  let uploadFile = multer({
    storage: storage,
    limits: {
      fileSize: 1024 * 1024 * 10, //5MB
    },
  }).single(fieldName);

  let uploadFileMiddleware = util.promisify(uploadFile);
  return uploadFileMiddleware;
}

module.exports = { createUploadMiddleware };
