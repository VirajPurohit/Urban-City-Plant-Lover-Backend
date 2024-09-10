const redis = require("redis");
let redisClient = undefined;

const initializeRedisClient = async function () {
  let redisURL = process.env.REDIS_URI;
  if (redisURL) {
    redisClient = redis.createClient({ url: redisURL }).on("error", (e) => {
      console.error("Failed to create redis client with error");
      console.error(e);
    });
    try {
      await redisClient.connect();
      console.log("Connected to redis successfully");
    } catch (err) {
      console.error("Connection to redis failed with error");
      console.error(err);
    }
  }
};
function isRedisWorking() {
  // verify wheter there is an active connection
  // to a Redis server or not
  return !!redisClient?.isOpen;
}

const writeData = async function (key, data, options) {
  if (isRedisWorking()) {
    try {
      // write data to the Redis cache
      await redisClient.set(key, data, options);
    } catch (e) {
      console.error(`Failed to cache data for key=${key}`, e);
    }
  }
};

const readData = async function (key) {
  let cachedValue = undefined;
  if (isRedisWorking()) {
    // try to get the cached response from redis
    return await redisClient.get(key);
  }

  return cachedValue;
};

module.exports = { initializeRedisClient, readData, writeData };
