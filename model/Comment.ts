import mongoose from "mongoose";
import moment from "moment";

const now = () => {
  return moment().toDate();
};

const CommentSchema = new mongoose.Schema({
  postID: mongoose.Schema.Types.ObjectId,
  author: mongoose.Schema.Types.ObjectId,
  date: {
    type: mongoose.Schema.Types.Date,
    default: now,
  },
  content: String,
});

export default mongoose.models.Comment ||
  mongoose.model("Comment", CommentSchema);
