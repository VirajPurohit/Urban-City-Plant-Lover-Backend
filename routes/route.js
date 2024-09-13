const post = require("../controllers/postsController");
const gemini = require("../controllers/gemini-controller");
const users = require("../controllers/userController");
const cityData = require("../controllers/revGeocodeController");
const comments = require("../controllers/commentController");
const likes = require("../controllers/likeController");
const cloudinary = require("../controllers/cloudinaryController");

const passport = require("passport");
const Users = require("../models/user");

let Router = require("express").Router();

async function refreshToken(req, res) {
  try {
    if (req.user) {
      //Get user from DB using userid from session
      let userID = req.user._id;
      let user = await Users.find({ _id: userID });
      user = user[0];
      // set today
      let today = new Date();
      today.setHours(0, 0, 0, 0);
      let newTokenUpdateDate = null;
      // Compare Token date
      //Checking if today is greater than or equal to next token update date
      // if yes, set token and set next token update date to tomorrow
      if (today >= user.nextTokenUpdateDate) {
        newTokenUpdateDate = new Date();
        newTokenUpdateDate.setDate(newTokenUpdateDate.getDate() + 1);
        newTokenUpdateDate.setHours(0, 0, 0, 0);

        let data = await Users.findOneAndUpdate(
          { _id: userID },
          { $set: { tokens: 9, nextTokenUpdateDate: newTokenUpdateDate } },
          { new: true }
        );
      }
      res.redirect(process.env.CLIENT_URL);
    }
  } catch (err) {
    console.log(err);
    res.status(500).send({
      msg: `Error:  ${err}`,
      stack: err.stack,
    });
  }
  //console.log(req.user);
}

async function tokenCheckMiddleware(req, res, next) {
  try {
    if (req.user) {
      let userID = req.user._id;
      let user = await Users.find({ _id: userID });
      user = user[0];
      if (user.tokens >= 1) {
        //await Users.findOneAndUpdate({ _id: userID }, { $inc: { tokens: -1 } });
        next();
      } else {
        res.status(403).send({
          error: true,
          msg: "Not Authorized, user not logged in or tokens exhausted for the day",
        });
      }
    } else {
      res.status(403).send({
        error: true,
        msg: "Not Authorized, user not logged in or tokens exhausted for the day",
      });
    }
  } catch (err) {
    console.log(err);
    res.status(500).send({
      msg: `Error:  ${err}`,
      stack: err.stack,
    });
  }
}

module.exports = (app, io) => {
  io.on("connection", (socket) => {
    socket.on("disconnect", () => {});
  });

  /* Authentication Routes*/
  Router.get(
    "/auth/google",
    passport.authenticate("google", ["profile", "email"])
  );

  Router.get(
    "/auth/google/callback",
    passport.authenticate("google", {
      failureRedirect: "/login/failed",
      // successRedirect: process.env.CLIENT_URL,
    }),
    refreshToken
  );

  Router.get("/login/failed", (req, res) => {
    res.status(401).json({
      error: true,
      msg: "Login Failure",
    });
  });

  Router.get("/auth/login/success", (req, res) => {
    if (req.user) {
      // console.log("From /auth/login/success route ", req.user);
      // req.session.user = req.user;
      res.status(200).json({
        error: false,
        message: "Successfully Logged In",
        user: req.user,
      });
    } else {
      res.status(403).json({ error: true, msg: "Not Authorized" });
    }
  });

  Router.get("/auth/logout", (req, res, next) => {
    req.logout(function (err) {
      if (err) {
        return next(err);
      }
    });
    res.redirect(process.env.CLIENT_URL);
  });

  /* Application Routes */
  /* Gemini Routes*/
  Router.post(
    "/plantSuggestions",
    tokenCheckMiddleware,
    gemini.getPlantSuggestions
  );
  Router.post("/identifyPlants", tokenCheckMiddleware, gemini.getPlantId);
  Router.post("/plantTips", tokenCheckMiddleware, gemini.getGardeningTips);

  /*Image Post Routes*/
  Router.post("/new-post", post.create);
  Router.get("/gallery", post.findAll);
  Router.get("/gallery:sortby", post.findAll);
  Router.get("/post", post.findPostByTitle); // Route for query params
  Router.get("/post/:id", post.findPostById);
  Router.delete("/delpost/:title", post.deleteOnePostByTitle);
  Router.post("/delete/:postId", post.deleteOnePostById);
  /*User Routes*/
  Router.get("/usersAll", users.findAll);
  Router.post("/user/:userId", users.findUserbyId);
  Router.post("/new-user", users.create);
  Router.delete("/deluser/:username", users.deleteUserByUsername);
  /* User Position */
  Router.post("/getAddr/:lat/:long", cityData.getCity);
  /*Comments Routes*/
  Router.post("/:postId/comments", comments.createComment, (req, res, next) => {
    io.emit("comments", { id: req.params.postId });
    res.status(201).send({ msg: "Comment Added" });
  });
  Router.get("/:postId/comments", comments.getAllPostComments);
  Router.post(
    "/:postId/delComments",
    comments.deletePostComment,
    (req, res, next) => {
      io.emit("comments", { id: req.params.postId });
      res.status(201).send({ msg: "Comment Deleted" });
    }
  );
  /*Like Routes*/
  Router.post("/:postId/getlikes", likes.getLikes);
  Router.post("/:postId/updateLikes", likes.updateLikes, (req, res, next) => {
    io.emit("likes", { id: req.params.postId });
    res.status(200).send({ msg: "Update Successful" });
  });

  /*Cloudinary Route*/

  Router.post("/removePic", cloudinary.remove);

  app.use(Router);
};
