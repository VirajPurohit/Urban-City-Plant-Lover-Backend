const { mongoose } = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema({
  //profilepic
  profilepic: {
    public_id: { type: String },
    fileURL: { type: String },
    fileExt: { type: String },
    fileSize: { type: String },
  },
  username: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, minLength: 6, maxLength: 20 },
  tokens: { type: Number, default: 9, min: 0, max: 9 },
  nextTokenUpdateDate: {
    type: Date,
    default: function () {
      let tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      return tomorrow;
    },
  },
});

module.exports = mongoose.model("Users", userSchema);
