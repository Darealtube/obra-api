import { ObjectId } from "mongodb";
import User from "../../model/User";
import { UserType } from "../../types";

export const queryValidateResolvers = {
  async isLikedArtist(_parent, args, _context, _info) {
    const user: UserType = await User.findById(args.userID);
    const artist: UserType = await User.findOne({ name: args.artistName });

    return artist && user ? user.likedArtists.includes(artist._id) : false;
  },
  async isLikedPost(_parent, args, _context, _info) {
    const user: UserType = await User.findOne({
      _id: args.userID,
      likedPosts: { $in: [new ObjectId(args.postID)] },
    });

    return user ? true : false;
  },
  async userExists(_parent, args, _context, _info) {
    const origUser: UserType = await User.findById(args.userId).lean();
    const user: UserType = await User.findOne({ name: args.userName }).lean();

    return user ? (user?.name === origUser?.name ? false : true) : false;
  },
  async isAdmin(_parent, args, _context, _info) {
    const user: UserType = await User.findById(args.id).lean();
    return user ? user.admin : false;
  },
};
