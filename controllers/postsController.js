const Posts = require("../models/posts");
const Users = require("../models/user");
const { createUploadMiddleware } = require("../utils/multerUpload");
const cloudinary = require("../utils/cloudinary");

let uploadFile = createUploadMiddleware("./uploads", "img_file");
let uploadOnCloudinary = cloudinary.uploadOnCloudinary;
let removeFromCloudinary = cloudinary.removeFromCloudinary;

exports.create = async (req, res) => {
  try {
    await uploadFile(req, res);
    if (req.file === undefined || req.file === "" || req.file === null) {
      res.status(400).send({ msg: "No file selected for upload" });
    } else {
      const result = await uploadOnCloudinary(
        req.file.path,
        "Urban_City_Plant_Lover/Posts/"
      );

      let newPost = new Posts({
        title: req.body.img_title,
        description: req.body.img_desc,
        pic: {
          public_id: result.public_id,
          fileURL: result.url,
          fileExt: result.format,
          fileSize: result.bytes,
        },
        postedBy: req.body.postedBy,
      });
      let data = await newPost.save();
      res.status(200).send({ msg: "File uploaded successfully", data: data });
    }
  } catch (err) {
    return res.status(500).send({ msg: `Error: ${err}`, stack: err.stack });
  }
};

exports.findAll = async (req, res) => {
  let sortbyval = "";
  try {
    let data;
    if (req.params.sortby === undefined || req.params.sortby === null) {
      data = await Posts.find({});
      return res.status(200).send(data);
    } else if (req.params.sortby === "upvotes") {
      sortbyval = "totalVotes";
    } else if (req.params.sortby === "latest") {
      sortbyval = "createdAt";
    }
    data = await Posts.find()
      .sort({ [sortbyval]: "desc" })
      .exec();
    res.status(200).send(data);
  } catch (err) {
    let x = req.params.sortby;
    res.status(500).send({
      msg: `Error ${err}`,
      sortby: x,
      val: sortbyval,
      stack: err.stack,
    });
  }
};

exports.findPostByTitle = async (req, res) => {
  let data = null;
  try {
    if (req.query.title === "undefined") {
      res.status(400).send({ msg: "title not specified" });
    } else {
      data = await Posts.where({ title: req.query.title }).limit(1);
    }
    if (data.length === 0) res.status(404).send({ msg: "Invalid title" });
    else res.status(200).send(data[0]);
  } catch (err) {
    res.status(500).send({ msg: `Error: ${err}`, stack: err.stack });
  }
};

exports.findPostById = async (req, res) => {
  let data = null,
    userdata = null;
  try {
    if (req.params.id === undefined || req.params.id === null) {
      res.status(400).send({ msg: "Post id not specified" });
    } else {
      data = await Posts.find({ _id: req.params.id })
        .populate("postedBy", "username profilepic.fileURL")
        .exec();
    }
    if (data.length === 0) {
      res.status(404).send({ msg: "Post not found" });
    } else {
      res.status(200).send(data[0]);
    }
  } catch (err) {
    console.log(err);
    res.status(500).send({ msg: `Error: ${err}`, stack: err.stack });
  }
};

exports.deleteOnePostByTitle = async (req, res) => {
  try {
    if (req.params.title === "undefined") {
      res.status(400).send({ msg: "title not specified" });
    } else {
      let post = await Posts.where({ title: req.params.title }).limit(1);
      if (post.length === 0) res.status(400).send({ msg: "Invalid title" });
      else {
        post = post[0];
        //console.log("Deleting post: ", post);
        let cloudinaryResult = await removeFromCloudinary(post.pic.public_id);
        let result = await Posts.deleteOne({ title: post.title });
        //console.log("Post deleted from DB");
        res
          .status(200)
          .send({ "Db Status": result, "Cloudinary Status": cloudinaryResult });
      }
    }
  } catch (err) {
    res.status(500).send({
      msg: `Error:  ${err}`,
      stack: err.stack,
    });
  }
};

exports.deleteOnePostById = async (req, res) => {
  try {
    if (req.params.postId === "undefined") {
      res.status(400).send({ message: "title not specified" });
    } else {
      let post = await Posts.where({ _id: req.params.postId }).limit(1);
      if (post.length === 0) res.status(400).send({ message: "Invalid Id" });
      else {
        post = post[0];
        //console.log("Deleting post: ", post);
        let cloudinaryResult = await removeFromCloudinary(post.pic.public_id);
        let result = await Posts.deleteOne({ _id: post._id });
        //console.log("Post deleted from DB");
        res
          .status(200)
          .send({ "Db Status": result, "Cloudinary Status": cloudinaryResult });
      }
    }
  } catch (err) {
    res.status(500).send({
      msg: `Error:  ${err}`,
      stack: err.stack,
    });
  }
};

/*
exports.updatePost = async (req, res) => {
  let postData = null;
  try {
    postData = await Posts.findOneAndUpdate(
      { _id: req.params.id },
      { totalVotes: req.body.totalVotes }
    );
    res.status(200).send({ message: "Post Votes updated" });
  } catch (err) {
    console.log(err);
    res.status(500).send({ message: `Error: ${err}` });
  }
};*/
