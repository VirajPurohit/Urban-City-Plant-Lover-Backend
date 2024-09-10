const { GoogleGenerativeAI } = require("@google/generative-ai");
const { processText } = require("../utils/processText");
const {
  getPlantImagesFromGoogle,
} = require("../utils/getPlantImagesFromGoogle");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

function cleanup(text) {
  let firstIndex = text.indexOf("[");
  let LastIndex = text.lastIndexOf("]");
  return text.slice(firstIndex, LastIndex);
}

async function addPlantImages(PlantObjArr) {
  try {
    let promises = [];
    // console.log("Data Received ", PlantObjArr);
    for (let i = 0; i < PlantObjArr.length; i++) {
      promises.push(
        (PlantObjArr[i].img = await getPlantImagesFromGoogle(
          PlantObjArr[i].name
        ))
      );
    }
    await Promise.all(promises);
    //console.log("Results: ", PlantObjArr);
    return PlantObjArr;
  } catch (err) {
    console.log(err);
  }
}

function parseFromJSON(text) {
  try {
    //console.log("Input ", text);
    let result = JSON.parse(text);
    return result;
  } catch (err) {
    console.log("JSON Exception : ", text);
    text = cleanup(text);
    text = parseFromText(text);
    return text;
  }
}

function parseFromText(text) {
  let prevopeningCurlyBraceIndex = 0;
  let prevclosingCurlyBraceIndex = 0;
  let result = [];

  while (text.indexOf("{", prevopeningCurlyBraceIndex) !== -1) {
    let firstIndex = text.indexOf("{", prevopeningCurlyBraceIndex);
    let lastIndex = text.indexOf("}", prevclosingCurlyBraceIndex);

    prevopeningCurlyBraceIndex = firstIndex + 1;
    prevclosingCurlyBraceIndex = lastIndex + 1;

    let objStr = text.slice(firstIndex, lastIndex + 1);
    let obj = {};

    let name, description, benefits;

    let prevcolonIndex = 0,
      prevNewLineIndex = objStr.indexOf("\n");

    firstIndex = objStr.indexOf(":", prevcolonIndex);
    lastIndex = objStr.indexOf(`\n`, prevNewLineIndex + 1);
    name = objStr.slice(firstIndex + 1, lastIndex - 1);
    obj.name = new String(name.replaceAll('"', ""));
    prevcolonIndex = firstIndex + 1;
    prevNewLineIndex = objStr.indexOf("\n", lastIndex);

    firstIndex = objStr.indexOf(":", prevcolonIndex);
    lastIndex = objStr.indexOf("\n", prevNewLineIndex + 1);
    description = objStr.slice(firstIndex + 1, lastIndex - 1);
    obj.description = new String(description.replaceAll('"', ""));
    prevcolonIndex = firstIndex + 1;

    firstIndex = objStr.indexOf(":", prevcolonIndex);
    lastIndex = objStr.indexOf("]");
    benefits = objStr.slice(firstIndex + 1, lastIndex + 1);

    benefits = benefits.replaceAll("\n", "");
    benefits = benefits.replace("[", "");
    benefits = benefits.replace("]", "");

    benefits = benefits.split(",");

    obj.benefits = benefits.map((ele) => new String(ele.replaceAll('"', "")));

    result.push(obj);
  }

  return result;
}

async function plantSuggestions(city, plant_type) {
  try {
    if (city) {
      const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
      });
      const prompt = `Can you suggest some ${plant_type} plants to grow in ${city}'s climate ?
              Your response must be an array conatining valid JSON object for five plants. 
              Each plant object has following schema: 
             {
               name: Name of the plant,
               description : Description of the plant,
               benefits: Array describing benefits associated with the plant
             }
               Please do not add any additional information other then requested above
             `;
      const generationConfig = {
        maxOutputTokens: 100,
        response_mime_type: "application/json",
      };

      const result = await model.generateContent(prompt, generationConfig);
      const response = await result.response;
      let text = response.text();
      text = processText(text); // Removing Markup from text
      //console.log("Before Parsing: ", text);
      //text = cleanup(text);
      text = parseFromJSON(text); // Parsing from JSON
      //console.log(text);

      if (text instanceof Object && text.constructor === Object) {
        let key = Object.keys(text)[0];
        text = await addPlantImages(text[key]);
      } else if (Array.isArray(text)) {
        text = await addPlantImages(text);
        // console.log("Received from function: ", text);
      }
      return { response: text };
    }
    return null;
  } catch (err) {
    console.log(err);
  }
}

module.exports = { plantSuggestions };
