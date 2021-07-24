import moment from "moment";
import mongoose from "mongoose";

const now = () => {
  return moment().toDate();
};

const ReportSchema = new mongoose.Schema({
  senderId: mongoose.Schema.Types.ObjectId,
  reportedId: mongoose.Schema.Types.ObjectId,
  type: String,
  date: {
    type: mongoose.Schema.Types.Date,
    default: now,
  },
  title: String,
  description: String,
  reason: String,
  bugVid: String,
  vidFormat: String,
});

export default mongoose.models.Report || mongoose.model("Report", ReportSchema);
