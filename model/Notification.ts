import moment from "moment";
import mongoose from "mongoose";

const now = () => {
  return moment().toDate();
};

const NotificationSchema = new mongoose.Schema({
  commissionId: mongoose.Schema.Types.ObjectId,
  commissioner: mongoose.Schema.Types.ObjectId,
  date: {
    type: mongoose.Schema.Types.Date,
    default: now,
  },
  description: String,
  read: Boolean,
});

export default mongoose.models.Notification ||
  mongoose.model("Notification", NotificationSchema);
