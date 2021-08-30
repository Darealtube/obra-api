import { ObjectId } from "mongodb";
import User from "../../model/User";

export const queryValidateResolvers = {
  async isLikedArtist(_parent, args, _context, _info) {
    const user = await User.findById(args.userID);
    const artist = await User.findOne({ name: args.artistName });

    return artist && user ? user.likedArtists.includes(artist._id) : false;
  },
  async isLikedPost(_parent, args, _context, _info) {
    const user = await User.findOne({
      _id: args.userID,
      likedPosts: { $in: [new ObjectId(args.postID)] },
    });

    return user ? true : false;
  },
  async userExists(_parent, args, _context, _info) {
    const origUser = await User.findById(args.userId).lean();
    const user = await User.findOne({ name: args.userName }).lean();

    return user ? (user?.name === origUser?.name ? false : true) : false;
  },
  async isAdmin(_parent, args, _context, _info) {
    const user = await User.findById(args.id).lean();
    return user ? user.admin : false;
  },
};
