import mongoose from "mongoose";
import moment from "moment";

const now = () => {
  return moment().toDate();
};

const HistorySchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  lastDateViewed: {
    type: mongoose.Schema.Types.Date,
    default: now,
  },
  viewed: mongoose.Schema.Types.ObjectId,
});

export default mongoose.models.History ||
  mongoose.model("History", HistorySchema);
