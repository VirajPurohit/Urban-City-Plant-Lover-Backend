const { Navigator } = require("node-navigator");
const navigator = new Navigator();

const getCurrentPosition = () => {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition((result, err) => {
      if (err) {
        return reject(err);
      }
      resolve(result);
    });
  });
};

async function getLatLong() {
  let latlng;
  try {
    let result = await getCurrentPosition();
    latlng = result.latitude.toString() + "," + result.longitude.toString();
    return latlng;
  } catch (err) {
    console.log(err);
  }
}

module.exports = { getLatLong };
