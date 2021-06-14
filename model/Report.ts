import mongoose from "mongoose";

const ReportSchema = new mongoose.Schema({
  senderId: mongoose.Schema.Types.ObjectId,
  reportedPostId: mongoose.Schema.Types.ObjectId,
  date: String,
  title: String,
  description: String,
  reason: String,
});

export default mongoose.models.Report ||
  mongoose.model("Report", ReportSchema);