import moment from "moment";
import mongoose from "mongoose";

const now = () => {
  return moment().format();
};

const CommissionSchema = new mongoose.Schema({
  fromUser: mongoose.Schema.Types.ObjectId,
  toArtist: mongoose.Schema.Types.ObjectId,
  title: String,
  description: String,
  sampleArt: String,
  width: Number,
  height: Number,
  deadline: String,
  price: Number,
  rates: Array,
  dateIssued: {
    type: String,
    default: now,
  },
  finished: {
    type: Boolean,
    default: false,
  },
  accepted: {
    type: Boolean,
    default: false,
  },
  finishedArt: String,
  finishedwatermarkArt: String,
  message: String,
});

export default mongoose.models.Commission ||
  mongoose.model("Commission", CommissionSchema);
