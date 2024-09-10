const fs = require("fs");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { processText } = require("../utils/processText");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

function fileToGenerativePart(path, mimeType) {
  return {
    inlineData: {
      data: Buffer.from(fs.readFileSync(path)).toString("base64"),
      mimeType,
    },
  };
}

async function getPlantNameandDetails(path, mimeType) {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const prompt = `Identify the plant in the picture?
                   Your response must be a JSON object with following schema
                    *name: Common name of the plant
                    *scientificName : scientific name of the plant
                    *description : Description of the plant
                    
                    If the provided picture is not of a plant
                    return following JSON Schema
                    *name : Not a Plant
                    *scientificName : N/A
                    *description: Provided picture is not of a plant
                    
                    If the provided picture is not clear enough to identify the plant
                    return following JSON Schema
                    *name: Unable to identify the plant from provided picture
                    *scientificName : N/A
                    *description: Provided picture is not clear enough to identify the plant
                    `;
  const imageParts = [fileToGenerativePart(path, mimeType)];
  //const generationConfig = { maxOutputTokens: 100 };
  const result = await model.generateContent([prompt, ...imageParts]);
  const response = await result.response;
  let text = response.text();
  text = processText(text); // Removing Markup from text
  text = JSON.parse(text);
  return { response: text, filePath: path };
}

async function getPlantName(path, mimeType) {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const prompt = `Identify the plant in the picture?
                  Your response must be a JSON object with following schema
                  *name: Common name of the plant`;

  const imageParts = [fileToGenerativePart(path, mimeType)];
  //const generationConfig = { maxOutputTokens: 100 };
  const result = await model.generateContent([prompt, ...imageParts]);
  const response = await result.response;
  let text = response.text();
  text = processText(text); // Removing Markup from text
  text = JSON.parse(text);
  return { response: text };
}

async function getPlantTips(path, mimeType) {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const prompt = `Identify and provide gardening tips in detail for this plant? 
                  Your response must be a JSON object with following schema
                    *name: Common name of the plant
                    *scientificName : scientific name of the plant
                    *description : Description of the plant
                   *gardeningTips: Array describing gardening tips associated with plant
                   
                    If the provided picture is not of a plant
                      return following JSON Schema
                      *name : Not a Plant
                      *scientificName : N/A
                      *description: Provided picture is not of a plant 
                      *gardeningTips: []

                      If the provided picture is not clear enough to identify the plant
                        return following JSON Schema
                        *name: Unable to identify the plant from provided picture
                        *scientificName : N/A
                        *description: Provided picture is not clear enough to identify the plant
                        *gardeningTips: []
                   `;
  const imageParts = [fileToGenerativePart(path, mimeType)];
  const result = await model.generateContent([prompt, ...imageParts]);
  const response = await result.response;
  let text = response.text();
  text = processText(text); // Removing Markup from text
  text = JSON.parse(text);

  return { response: text, filePath: path };
}

module.exports = { getPlantNameandDetails, getPlantTips, getPlantName };
