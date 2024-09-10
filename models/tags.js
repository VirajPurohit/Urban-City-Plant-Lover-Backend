const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const tagSchema = new Schema({
  tagname: { type: String, required: true },
  posts: [{ type: Schema.Types.ObjectId, ref: "Posts" }],
});

module.exports = mongoose.model("Tags", tagSchema);
