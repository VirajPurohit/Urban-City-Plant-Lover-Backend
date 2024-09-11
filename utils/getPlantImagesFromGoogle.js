const axios = require("axios");

const cseID = process.env.GOOGLE_PROGRAMMABLE_SEARCH_ENGINE;
const apiKey = process.env.GOOGLE_API_KEY;

async function getPlantImagesFromGoogle(plantName) {
  const baseUrl = `https://www.googleapis.com/customsearch/v1?q=${plantName}&cx=${cseID}&key=${apiKey}&searchType=image&num=10&filetype:jpgORfiletype:jpegORfiletype:png`;
  try {
    let response = await axios.get(baseUrl);
    if (response.status === 200 && response.data.items.length > 0) {
      //console.log(`${plantName}:  `, response.data.items[0].link);
      //return response.data.items[0].link;
      let images = response.data.items;
      let result;
      for (let i = 0; i < images.length; i++) {
        result = await checkImageAvail(images[i].link);
        if (result) {
          return images[i].link;
        }
      }
    } else {
      return "No Image Found";
    }
  } catch (err) {
    console.log(err);
  }
}

async function checkImageAvail(imgUrl) {
  try {
    const imgCheck = await axios.head(imgUrl);
    if (imgCheck.status === 200) {
      return true;
    }
    return false;
  } catch (err) {
    return false;
  }
}

module.exports = { getPlantImagesFromGoogle };
