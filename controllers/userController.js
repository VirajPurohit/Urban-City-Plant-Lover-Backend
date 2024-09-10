const Users = require("../models/user");
const { createUploadMiddleware } = require("../utils/multerUpload");
const cloudinary = require("../utils/cloudinary");

let uploadFile = createUploadMiddleware("./uploads", "profile_img"); //Multer Upload

let uploadOnCloudinary = cloudinary.uploadOnCloudinary;
let removeFromCloudinary = cloudinary.removeFromCloudinary;

exports.create = async (req, res) => {
  try {
    await uploadFile(req, res);
    if (req.file === undefined) {
      res.status(400).send({ msg: "No profile-image selected for upload" });
    } else {
      const result = await uploadOnCloudinary(
        req.file.path,
        "Urban_City_Plant_Lover/User_Profiles"
      );
      let newUser = new Users({
        username: req.body.username,
        password: req.body.password,
        email: req.body.email,
        profilepic: {
          public_id: result.public_id,
          fileURL: result.url,
          fileExt: result.format,
          fileSize: result.bytes,
        },
      });
      let data = await newUser.save();
      res
        .status(200)
        .send({ msg: "new User created successfully", data: data });
    }
  } catch (err) {
    return res.status(500).send({
      msg: `Error:  ${err}`,
      stack: err.stack,
    });
  }
};

exports.findAll = async (req, res) => {
  let data = await Users.find({});
  res.send(data);
};

exports.findUserbyId = async (req, res) => {
  let userData = null;
  try {
    if (req.body.userId === "undefined" || req.body.userId === "null") {
      res.status(400).send({ msg: "UserId not specified" });
    } else {
      userData = await Users.where({ _id: req.body.userId });
      if (userData.length === 0)
        res.status(404).send({ msg: "User not found" });
      else res.status(200).send({ user: userData[0] });
    }
  } catch (err) {
    res.status(500).send({ msg: `Error:  ${err}`, stack: err.stack });
  }
};

exports.deleteUserByUsername = async (req, res) => {
  // Todo : Add functionality to remove all posts by user before deleting user
  if (req.params.username === "undefined") {
    res.status(400).send({ msg: "username not specified" });
  } else {
    try {
      let user = await Users.where({ username: req.params.username }).limit(1);
      if (user.length === 0) res.status(400).send({ msg: "Invalid title" });
      else {
        user = user[0];
        console.log("Deleting User: ", user);
        let cloudinaryResult = await removeFromCloudinary(user.pic.public_id);
        let result = await Users.deleteOne({ username: req.params.username });
        console.log("Post deleted from DB");
        res
          .status(200)
          .send({ "Db Status": result, "Cloudinary Status": cloudinaryResult });
      }
    } catch (err) {
      res.status(500).send({
        msg: `Error:  ${err}`,
        stack: err.stack,
      });
    }
  }
};
