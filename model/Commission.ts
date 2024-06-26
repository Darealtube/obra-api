import moment from "moment";
import mongoose from "mongoose";

const now = () => {
  return moment().toDate();
};

const CommissionSchema = new mongoose.Schema({
  fromUser: mongoose.Schema.Types.ObjectId,
  toArtist: mongoose.Schema.Types.ObjectId,
  title: String,
  description: String,
  sampleArt: String,
  width: Number,
  height: Number,
  deadline: mongoose.Schema.Types.Date,
  price: Number,
  rates: Array,
  dateIssued: {
    type: mongoose.Schema.Types.Date,
    default: now,
  },
});

export default mongoose.models.Commission ||
  mongoose.model("Commission", CommissionSchema);
