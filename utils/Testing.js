const mongoose = require("mongoose");
const Users = require("../models/user");

const run = async () => {
  try {
    await mongoose.connect(
      "mongodb+srv://purohitvirajk:MongodbAtlasPswd@cluster0.symqqaq.mongodb.net/Urban_City_Plant_Lover?retryWrites=true&w=majority&appName=Cluster0"
    );
    console.log("Connected to DB");
    newTokenUpdateDate = new Date();
    newTokenUpdateDate.setDate(newTokenUpdateDate.getDate() + 1);
    newTokenUpdateDate.setHours(0, 0, 0, 0);
    let data = await Users.updateMany(
      {},
      { $set: { tokens: 9, nextTokenUpdateDate: newTokenUpdateDate } },
      { new: true },
      { strict: false }
    );

    //-----------------------------------------------------------------------------------------
  } catch (err) {
    console.log(err);
  }
};

run();
