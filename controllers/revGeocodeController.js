const { reverseGeocode } = require("../utils/reverseGeocode");
const readData = require("../utils/redis").readData;
const writeData = require("../utils/redis").writeData;

exports.getCity = async (req, res) => {
  let latlng = "";
  let results;
  let isCached = false;
  try {
    if (
      req.params.lat === "undefined" ||
      req.params.long === "undefined" ||
      req.params.lat === "null" ||
      req.params.long === "null"
    ) {
      res.status(400).send({ msg: "Latitude or Longitude missing" });
    } else {
      const cacheResults = await readData(
        req.params.lat.toString() + "," + req.params.long.toString()
      );
      if (cacheResults) {
        isCached = true;
        results = JSON.parse(cacheResults);
      } else {
        latlng = req.params.lat.toString() + "," + req.params.long.toString();
        results = await reverseGeocode(latlng);
        await writeData(latlng, JSON.stringify(results), { EX: 1800 });
      }

      res.status(200).send(results);
    }
  } catch (err) {
    res.status(500).send({ msg: `Error: ${err}`, stack: err.stack });
  }
};
