const Post = require("../models/posts");
const mongoose = require("mongoose");

let getVotes = async (postId, userId) => {
  //let userId = req.user._id;
  //let postId = req.params.id;
  let userState = { upvote: null, downvote: null };
  let postTotalVotes = 0;
  let userUpvote, userDownvote;

  /*if (postId === null || postId === undefined) {
    res.status(400).send({ message: "postId not specified" });
  }
  if (userId === null || userId === undefined) {
    res.status(400).send({ message: "UserId not specified" });
  } else {*/
  let post = await Post.find({ _id: postId });
  post = post[0];
  //console.log(post);
  if (post.upvotes.length === 0 && post.downvotes.length === 0) {
    userState.upvote = false;
    userState.downvote = false;
    postTotalVotes = 0;
    //console.log(userState, postTotalVotes);
    //res.status(200).send({ state: userState, upvotes: postTotalVotes });
  }
  userUpvote = post.upvotes.indexOf(userId);
  userDownvote = post.downvotes.indexOf(userId);

  userState.upvote = userUpvote === -1 ? false : true;
  userState.downvote = userDownvote === -1 ? false : true;

  postTotalVotes = post.upvotes.length - post.downvotes.length;
  console.log("getVotes Result : ", userState, postTotalVotes);

  //res.status(200).send({ state: userState, upvotes: postTotalVotes });
};

let updateVotes = async (postId, userId, userState) => {
  //let userId = req.body.userId;
  //const userState = req.body.userState;
  //const postId = req.params.postId;

  let post = await Post.find({ _id: postId });
  post = post[0];
  // Case 1 : UserState.Upvote === True

  if (userState.upvote === true) {
    console.log("Case 1");
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
    console.log("Case 2");
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
  // Checking the Downvote Part
  //Case 3: UserState.Downvote === True
  if (userState.downvote === true) {
    console.log("Case 3");
    //Case 3.1: Downvotes Array is empty
    console.log("Start of correct block");
    if (post.downvotes.length === 0) {
      console.log("I am in correct block");
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
    console.log("Case 4");
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
  console.log(
    "UpdateVotes Result: ",
    post.totalVotes,
    post.upvotes,
    post.downvotes
  );
};

const run = async () => {
  try {
    await mongoose.connect(
      "mongodb+srv://purohitvirajk:MongodbAtlasPswd@cluster0.symqqaq.mongodb.net/Urban_City_Plant_Lover?retryWrites=true&w=majority&appName=Cluster0"
    );
    console.log("Connected to DB");

    //getVotes("66a36e1f9c5ee188a2f1fc5d", "665a3b4449103dcb036affd4"); // postId, userId

    updateVotes("66a36e1f9c5ee188a2f1fc5d", "665a3b4449103dcb036affd4", {
      upvote: true,
      downvote: false,
    });
    getVotes("66a36e1f9c5ee188a2f1fc5d", "665a3b4449103dcb036affd4");

    /*const post2 = new Post({
      title: "testing",
      description: "testing",
      postedBy: "665a3b4449103dcb036affd4",
    });
    await post2.save();*/

    //-----------------------------------------------------------------------------------------
  } catch (err) {
    console.log(err);
  }
};

run();
