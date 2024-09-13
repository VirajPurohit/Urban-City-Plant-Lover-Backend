const GoogleStrategy = require("passport-google-oauth2").Strategy;
const Users = require("../models/user");

function initializePassportStratergy(passport) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: `${process.env.GOOGLE_AUTH_CALLBACK_URL}/auth/google/callback`, // The endpoint to which Google should redirect after successful login
        scope: ["profile", "email"],
        passReqToCallback: true,
      },
      async function (req, accessToken, refreshToken, profile, done) {
        console.log("Hello from PasReqCallback ", profile);
        try {
          let user = await Users.find({ username: profile.displayName });
          user = user.length !== 0 ? user[0] : null;

          if (user === null) {
            user = new Users({
              username: profile.displayName,
              email: profile.emails[0].value,
              profilepic: {
                fileURL: profile.photos[0].value,
              },
            });
            result = await user.save();
          }
          return done(null, user);
        } catch (err) {
          return done(err, null);
        }
      }
    )
  );

  passport.serializeUser((user, done) => {
    console.log("Hello from Serialize user ", user);
    process.nextTick(function () {
      done(null, user._id);
    });
  });

  passport.deserializeUser((userid, done) => {
    console.log("Hello from Deseialize user", userid);
    process.nextTick(async function () {
      let userFrmDB = null;
      try {
        userFrmDB = await Users.find({ _id: userid });
        userFrmDB = userFrmDB[0];
      } catch (err) {
        console.log(err);
      }

      done(null, userFrmDB);
    });
  });

  console.log("Passport Stratergy Initialized");
}

module.exports = { initializePassportStratergy };
