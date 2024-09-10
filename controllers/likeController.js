const Post = require("../models/posts");

exports.getLikes = async (req, res) => {
  let userId = req.body.userId;
  let postId = req.params.postId;
  let userState = { upvote: null, downvote: null };
  let postTotalVotes = 0;
  let userUpvote, userDownvote;

  try {
    if (postId === null || postId === undefined) {
      res.status(400).send({ msg: "postId not specified" });
    } else if (userId === null || userId === undefined) {
      res.status(400).send({ msg: "UserId not specified" });
    } else {
      let post = await Post.find({ _id: postId });
      post = post[0];
      if (post.upvotes.length === 0 && post.downvotes.length === 0) {
        userState.upvote = false;
        userState.downvote = false;
        postTotalVotes = 0;
        res.status(200).send({ state: userState, upvotes: postTotalVotes });
      } else {
        userUpvote = post.upvotes.indexOf(userId);
        userDownvote = post.downvotes.indexOf(userId);

        userState.upvote = userUpvote === -1 ? false : true;
        userState.downvote = userDownvote === -1 ? false : true;

        postTotalVotes = post.upvotes.length - post.downvotes.length;
        res.status(200).send({ state: userState, upvotes: postTotalVotes });
      }
    }
  } catch (err) {
    res.status(500).send({ msg: `Error: ${err}`, stack: err.stack });
  }
};

exports.updateLikes = async (req, res, next) => {
  let userId = req.body.userId;
  const userState = JSON.parse(req.body.userState);
  const postId = req.params.postId;

  try {
    if (postId === null || postId === undefined) {
      res.status(400).send({ message: "postId not specified" });
    }
    if (userId === null || userId === undefined) {
      res.status(400).send({ message: "UserId not specified" });
    } else {
      let post = await Post.find({ _id: postId });
      post = post[0];

      // Case 1 : UserState.Upvote === True
      if (userState.upvote === true) {
        // Case 1.1 : Upvotes Array is Empty
        if (post.upvotes.length === 0) {
          await Post.findOneAndUpdate(
            { _id: postId },
            { $push: { upvotes: userId } },
            { new: true }
          );
        }
        // Case 1.2 : Upvotes Array is not empty
        else {
          await Post.findOneAndUpdate(
            {
              _id: postId,
              upvotes: {
                $elemMatch: { $ne: userId },
              },
            },
            {
              $addToSet: {
                upvotes: userId,
              },
            }
          );
        }
      }
      // Case 2: UserState.Upvote === False
      else if (userState.upvote === false) {
        //Case 2.1: Upvotes Array is non-empty, if Upvotes Array is empty, no action needed
        if (post.upvotes.length !== 0) {
          await Post.findOneAndUpdate(
            {
              _id: postId,
              upvotes: {
                $elemMatch: { $eq: userId },
              },
            },
            {
              $pull: {
                upvotes: userId,
              },
            }
          );
        }
      }
      // Checking for Downvotes Cases
      //Case 3: UserState.Downvote === True
      if (userState.downvote === true) {
        //Case 3.1: Downvotes Array is empty
        if (post.downvotes.length === 0) {
          await Post.findOneAndUpdate(
            { _id: postId },
            { $push: { downvotes: userId } },
            { new: true }
          );
        }
        // Case 3.2: Downvotes Array is non-empty
        else {
          await Post.findOneAndUpdate(
            {
              _id: postId,
              downvotes: {
                $elemMatch: { $ne: userId },
              },
            },
            {
              $addToSet: {
                downvotes: userId,
              },
            }
          );
        }
      }
      //Case 4: UserState.Downvote === False
      else if (userState.downvote === false) {
        //Case 4.1 Downvotes Array is non-empty, if Downvotes Array is empty, no action needed
        if (post.downvotes.length !== 0) {
          await Post.findOneAndUpdate(
            {
              _id: postId,
              downvotes: {
                $elemMatch: { $eq: userId },
              },
            },
            {
              $pull: {
                downvotes: userId,
              },
            }
          );
        }
      }
    }
    next();
  } catch (err) {
    res.status(500).send({ msg: `Error: ${err}`, stack: err.stack });
  }
};
