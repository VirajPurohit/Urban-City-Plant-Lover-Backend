const { mongoose } = require("mongoose");
const Schema = mongoose.Schema;

const CommentSchema = new Schema({
  username: { type: String, required: true },
  profilePic: { type: String },
  commentedAt: {
    type: Date,
    default: () => {
      let createdDate = new Date(Date.now());
      return createdDate;
    },
  },
  comment: { type: String, required: true },
});

module.exports = mongoose.model("Comments", CommentSchema);
