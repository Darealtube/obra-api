import mongoose from "mongoose";
import moment from "moment";

const now = () => {
  return moment().toDate();
};

const PostSchema = new mongoose.Schema({
  author: mongoose.Schema.Types.ObjectId,
  date: {
    type: mongoose.Schema.Types.Date,
    default: now,
  },
  sale: String,
  price: String,
  art: String,
  watermarkArt: String,
  tags: Array,
  title: {
    type: String,
    required: true,
    maxlength: [40, "Title is too long!"],
  },
  description: {
    type: String,
    required: true,
    maxLength: [400, "Explain it more briefly."],
  },
  likes: {
    type: Number,
    default: 0,
  },
  comments: Array,
  forSale: Boolean,
  forSalePrice: String,
  width: Number,
  height: Number,
});

export default mongoose.models.Post || mongoose.model("Post", PostSchema);
