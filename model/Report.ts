import mongoose from "mongoose";

const ReportSchema = new mongoose.Schema({
  senderId: mongoose.Schema.Types.ObjectId,
  reportedId: mongoose.Schema.Types.ObjectId,
  type: String,
  date: String,
  title: String,
  description: String,
  reason: String,
  bugVid: String,
  vidFormat: String,
});

export default mongoose.models.Report ||
  mongoose.model("Report", ReportSchema);