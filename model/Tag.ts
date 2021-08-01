import mongoose from "mongoose";

const TagSchema = new mongoose.Schema({
  name: String,
  artCount: Number,
});

export default mongoose.models.Tags || mongoose.model("Tags", TagSchema);
