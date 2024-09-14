const { plantSuggestions } = require("../utils/gemini-pro");
const {
  getPlantName,
  getPlantTips,
  getPlantNameandDetails,
} = require("../utils/gemini-pro-vision");
const cloudinary = require("../utils/cloudinary");
const { createUploadMiddleware } = require("../utils/multerUpload");

let uploadFile = createUploadMiddleware("./uploads", "img_file");
const uploadOnCloudinary = cloudinary.uploadOnCloudinary;
const readData = require("../utils/redis").readData;
const writeData = require("../utils/redis").writeData;
const Users = require("../models/user");

//const removeFromCloudinary = cloudinary.removeFromCloudinary;

async function decrementToken(userId) {
  try {
    await Users.findOneAndUpdate({ _id: userId }, { $inc: { tokens: -1 } });
  } catch (err) {
    console.log(err);
  }
}

// Gets form data from "confirmAddress.ejs" then queries Gemini API to get plant suggestions for users
// Needs to be routed to POST method to route "/confirmAddress"
exports.getPlantSuggestions = async (req, res) => {
  let results;
  let isCached = false;
  let userId = req.user._id;
  let city = req.body.cityName,
    plant_type = req.body.plantTypeVal;
  try {
    if (city === "" || city === "null" || city === "undefined") {
      return res.status(403).send({ msg: "City not specified" });
    }
    const cacheResults = await readData(`${city}-${plant_type}`);
    if (cacheResults) {
      isCached = true;
      results = JSON.parse(cacheResults);
    } else {
      results = await plantSuggestions(city, plant_type);
      results = results.response;
      //console.log("Data received at Controller: ", results);
      await writeData(
        `${city}-${plant_type}`,
        JSON.stringify(results),
        (options = { EX: 1200 })
      );
    }
    decrementToken(userId);
    res.status(200).send({ results });
  } catch (err) {
    res.status(500).send({ msg: `Error: ${err}`, stack: err.stack });
  }
};

//Needs to be routed to Post method of "/identifyPlants"
// Gets plant image from plantSuggestion and queries getPlantName() method
// from file "gemini-pro-vision"
exports.getPlantId = async (req, res) => {
  let filePath, mimeType;
  let userId = req.user._id;
  try {
    await uploadFile(req, res);
    if (req.file === undefined) {
      res.status(400).send({ message: "No file selected for upload" });
    } else {
      filePath = req.file.path;
      mimeType = req.file.mimetype;
      let geminiResponse = await getPlantNameandDetails(filePath, mimeType);
      const result = await uploadOnCloudinary(
        req.file.path,
        "Urban_City_Plant_Lover/Plant_id_uploads/"
      );
      if (geminiResponse.response.scientificName === "N/A") {
        res.status(200).send({
          publicId: result.public_id,
          fileURL: result.url,
          response: geminiResponse.response,
        });
      } else {
        decrementToken(userId);
        res.status(200).send({
          publicId: result.public_id,
          fileURL: result.url,
          response: geminiResponse.response,
        });
      }
    }
  } catch (err) {
    return res.status(500).send({ msg: `Error: ${err}`, stack: err.stack });
  }
};

//Needs to be routed to Post method of "/plantTips"
//Takes an image as input from user
//returns gardening tips from Google Gemini for plant in image

exports.getGardeningTips = async (req, res) => {
  let geminiResponse;
  let isCached = false;
  let cachedResults;
  let userId = req.user._id;

  try {
    await uploadFile(req, res);
    if (req.file === undefined) {
      res.status(400).send({ message: "No file selected for upload" });
    } else {
      filePath = req.file.path;
      mimeType = req.file.mimetype;
      let plantName = await getPlantName(filePath, mimeType);
      plantName = plantName.response.name;

      if (plantName) {
        cachedResults = await readData(plantName);
      }
      if (cachedResults) {
        isCached = true;
        geminiResponse = JSON.parse(cachedResults);
      } else {
        geminiResponse = await getPlantTips(filePath, mimeType);
        await writeData(
          geminiResponse.response.name,
          JSON.stringify(geminiResponse),
          (options = { EX: 1200 })
        );
      }

      const result = await uploadOnCloudinary(
        req.file.path,
        "Urban_City_Plant_Lover/Gardening_tips"
      );
      if (geminiResponse.response.scientificName === "N/A") {
        res.status(200).send({
          publicId: result.public_id,
          fileURL: result.url,
          response: geminiResponse.response,
        });
      } else {
        decrementToken(userId);
        res.status(200).send({
          publicId: result.public_id,
          fileURL: result.url,
          response: geminiResponse.response,
        });
      }
    }
  } catch (err) {
    return res.status(500).send({ msg: `Error: ${err}`, stack: err.stack });
  }
};
