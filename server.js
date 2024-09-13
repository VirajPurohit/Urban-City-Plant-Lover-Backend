const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();
const session = require("express-session");
const http = require("http");
const socketIO = require("socket.io");
const passport = require("passport");
const MongoDBStore = require("connect-mongodb-session")(session);

const { initializeRedisClient } = require("./utils/redis");
const { initializePassportStratergy } = require("./utils/passport");

const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 5000;
const io = socketIO(server, {
  cors: {
    origin: [
      "https://urban-city-plant-lover.onrender.com/",
      "https://urban-city-plant-lover-backend.onrender.com/",
    ],
    credentials: true,
  },
});

server.listen(port, "0.0.0.0", () => {
  console.log(`Server is listening on port ${port}`);
});

const connectRedis = async () => {
  await initializeRedisClient();
};

connectRedis();

const connectDb = async () => {
  try {
    await mongoose.connect(process.env.MONGO_DB_URL);
    console.log("Connected to DB");
  } catch (err) {
    console.log("Error", err);
  }
};
connectDb();

initializePassportStratergy(passport);

app.use(express.static("./uploads"));

app.get("/", (req, res) => {
  res.render("index");
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

let corsOptions = {
  origin: [
    "https://urban-city-plant-lover.onrender.com/",
    "https://urban-city-plant-lover-backend.onrender.com/",
  ],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
};

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Methods", "POST, GET,PUT, DELETE");
  res.setHeader("Access-Control-Allow-Headers", "Content-type");

  let allowedOrigins = [
    "https://urban-city-plant-lover.onrender.com/",
    "https://urban-city-plant-lover-backend.onrender.com/",
  ];
  let origin = req.headers.origin;
  console.log(req.headers.origin);
  console.log(
    "Allowed origin includes origin : ",
    allowedOrigins.includes(origin)
  );

  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin); // restrict it to the required domain
  }
  next();
});

app.use(cors(corsOptions));

app.use(express.json());

//Adding Session Store

const sessionStore = new MongoDBStore({
  uri: process.env.MONGO_DB_URL,
  collection: "sessions",
});

sessionStore.on("error", function (error) {
  console.log(error);
});

app.use(
  session({
    secret: process.env.COOKIE_SECRET,
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
      maxAge: 1000 * 60 * 20,
      secure: false,
    },
  })
); // gives access to req.session object

//app.use(passport.initialize());
app.use(passport.session());
//app.use(passport.initialize());

app.set("view engine", "ejs");
app.set("views", path.resolve("./views"));

require("./routes/route")(app, io);
/*
//Testing
// Gets co-ordinates from browser,then queries Google Cloud API for user location

app.post("/", async (req, res) => {
  let data = await getLatLong();
  city = await reverseGeocode(data);
  res.render("confirmAddress", { city });
});

app.post("/identifyPlantsRoute", (req, res) => {
  res.render("identifyPlants");
});

app.post("/plantTipsRoute", (req, res) => {
  res.render("plantTips");
});

app.post("/postRoute", (req, res) => {
  res.render("post");
});

app.post("/new-userRoute", (req, res) => {
  res.render("user-registration");
});

app.post("/viewPosts", (req, res) => {
  res.render("getPosts");
});*/
