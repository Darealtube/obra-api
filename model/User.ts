import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  image: String,
  email: String,
  posts: Array,
  likedPosts: Array,
  likedArtists: Array,
  notifications: Array,
  tutorial: {
    type: Boolean,
    default: true,
  },
  name: String,
  age: String,
  country: String,
  birthday: String,
  phone: String,
  newUser: Boolean,
  artLevel: String,
  userBio: String,
  backdrop: String,
  commissions: Array,
  yourCommissions: Array,
  admin: Boolean,
  commissionPoster: String,
  commissionRates: Array,
  // More to come
});

export default mongoose.models.User || mongoose.model("User", UserSchema);
