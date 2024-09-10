const { mongoose, SchemaTypes } = require("mongoose");
const Schema = mongoose.Schema;
const User = require("./user");
const Comments = require("./comments");
const Tags = require("./tags");

const PostsSchema = new Schema({
  pic: {
    public_id: { type: String },
    fileURL: { type: String },
    fileExt: { type: String },
    fileSize: { type: String },
  },
  title: { type: String, required: true, maxLength: 100 },
  description: { type: String, maxLength: 500 },
  createdAt: {
    type: Date,
    default: () => {
      let createdDate = new Date(Date.now());
      createdDate = createdDate.toISOString().split("T")[0];
      return createdDate;
    },
  },
  totalVotes: { type: Number, default: 0 },
  upvotes: {
    type: [{ type: Schema.Types.ObjectId, ref: "Users" }],
    required: true,
    default: [],
  },
  downvotes: {
    type: [{ type: Schema.Types.ObjectId, ref: "Users" }],
    required: true,
    default: [],
  },
  postedBy: { type: Schema.Types.ObjectId, ref: "Users", required: true },
  tags: { type: [{ type: String }] },
  visiblity: {
    type: String,
    required: true,
    enum: ["public", "private"],
    default: "public",
  },
  state: { type: String, enum: ["Pending Approval", "Approved", "Reported"] },
  comments: { type: [{ type: Schema.Types.ObjectId, ref: "Comments" }] },
});

PostsSchema.post("findOneAndUpdate", async function () {
  const thisDoc = await this.model.findOne(this.getQuery());
  if (thisDoc) {
    thisDoc.totalVotes = thisDoc.upvotes.length - thisDoc.downvotes.length;
    await thisDoc.save();
  }
});

PostsSchema.post("save", async function (doc, next) {
  try {
    let taglist = doc.tags;
    let individualTag = "";
    for (let i = 0; i < taglist.length; i++) {
      individualTag = taglist[i];
      let tagobj = await Tags.where({ tagname: individualTag }).limit(1);

      if (tagobj.length === 0) {
        let newTag = new Tags({
          tagname: individualTag,
          posts: [doc._id],
        });
        await newTag.save();
      } else {
        let foundTag = tagobj[0];
        foundTag.posts.push(doc._id);
        await foundTag.save();
      }
    }
    //let data = await Tags.where({});
    //console.log(data);
  } catch (err) {
    console.log(err);
  }
  next();
});

PostsSchema.pre("remove", async function (doc, next) {
  try {
    let taglist = doc.tags;
    let individualTag = "";
    for (let i = 0; i < taglist.length; i++) {
      individualTag = taglist[i];
      let tagobj = await Tags.where({ tagname: individualTag }).limit(1);
      if (tagobj.posts.length === 1) {
        try {
          await Tags.deleteOne({ tagname: individualTag });
        } catch (err) {
          console.log(err.message);
        }
      } else {
        let index = tagobj.posts.indexOf(doc._id);
        tagobj.posts.splice(index, 1);
        try {
          await tagobj.save();
        } catch (err) {
          console.log(err.message);
        }
      }
    }
  } catch (err) {
    console.log(err.message);
  }
  next();
});

module.exports = mongoose.model("Posts", PostsSchema);
