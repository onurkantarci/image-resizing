const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const imageSchema = new Schema({
  filename: String,
  originalName: String,
  size: Number,
  mimeType: String,
  uploadDate: { type: Date, default: Date.now },
  width: Number,
  height: Number,
});

const Image = mongoose.model("image", imageSchema);

module.exports = Image;
