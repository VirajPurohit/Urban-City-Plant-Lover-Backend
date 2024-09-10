const Comments = require("../models/comments");
const Users = require("../models/user");
const Posts = require("../models/posts");

// Route: POST: /:postId/comments
// In Req.Body need to be pass userid, postid and comment text
exports.createComment = async (req, res, next) => {
  try {
    let user = await Users.findOne({ _id: req.body.userid });
    let post = null;
    let newComment = new Comments({
      username: user.username,
      profilePic: user.profilepic.fileURL,
      comment: req.body.comment,
    });
    await newComment.save();

    post = await Posts.findOneAndUpdate(
      { _id: req.params.postId },
      { $push: { comments: newComment } },
      { new: true }
    )
      .populate("comments")
      .exec();

    next();
  } catch (err) {
    res.status(500).send({ msg: `Error: ${err}`, stack: err.stack });
  }
};
//Route GET : /:postId/comment
exports.getAllPostComments = async (req, res) => {
  try {
    const post = await Posts.findById(req.params.postId)
      .populate({
        path: "comments",
        options: { sort: { commentedAt: -1 } },
      })
      .exec();
    res.status(200).send({ comments: post.comments });
  } catch (err) {
    res.status(500).send({ msg: `Error: ${err}`, stack: err.stack });
  }
};
//Route Delete : /:postId/:commentId
exports.deletePostComment = async (req, res, next) => {
  try {
    const postId = await Posts.findById(req.params.postId);
    const commentId = req.body.commentId;
    await Posts.findOneAndUpdate(
      {
        _id: postId,
        comments: {
          $elemMatch: { $eq: commentId },
        },
      },
      {
        $pull: {
          comments: commentId,
        },
      }
    );
    next();
  } catch (err) {
    res.status(500).send({ msg: `Error: ${err}`, stack: err.stack });
  }
};
