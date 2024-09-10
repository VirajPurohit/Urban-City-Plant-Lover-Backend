const cloudinary = require("../utils/cloudinary");
const removeFromCloudinary = cloudinary.removeFromCloudinary;

exports.remove = async function (req, res) {
  try {
    await removeFromCloudinary(req.body.publicId);
    res.status(200).send({ msg: "Image file removed from Cloudinary" });
  } catch (err) {
    res.status(500).send({ msg: `Error ${err}`, stack: err.stack });
  }
};
