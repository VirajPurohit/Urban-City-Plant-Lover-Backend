async function reverseGeocode(latlng) {
  try {
    let response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latlng}&key=${process.env.GEOCODE_API_KEY}&result_type=administrative_area_level_2`
    );

    let result = await response.json();
    if (result.status === "OK") {
      let fetchedAddr = result.results[0];
      let address = fetchedAddr.formatted_address;
      return address.split(",")[0];
    }
  } catch (err) {
    console.log(err);
    return null;
  }
}

module.exports = { reverseGeocode };
