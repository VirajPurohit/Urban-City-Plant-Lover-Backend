const axios = require("axios");

const cseID = process.env.GOOGLE_PROGRAMMABLE_SEARCH_ENGINE;
const apiKey = process.env.GOOGLE_API_KEY;

async function getPlantImagesFromGoogle(plantName) {
  const baseUrl = `https://www.googleapis.com/customsearch/v1?q=${plantName}&cx=${cseID}&key=${apiKey}&searchType=image&num=1&filetype:jpgORfiletype:jpegORfiletype:png`;
  try {
    let response = await axios.get(baseUrl);
    if (response.status === 200 && response.data.items.length > 0) {
      //console.log(`${plantName}:  `, response.data.items[0].link);
      return response.data.items[0].link;
    } else {
      return "No Image Found";
    }
  } catch (err) {
    console.log(err);
  }
}

module.exports = { getPlantImagesFromGoogle };
