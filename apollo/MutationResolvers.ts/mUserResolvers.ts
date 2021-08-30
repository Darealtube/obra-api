import { ObjectId } from "mongodb";
import User from "../../model/User";

export const mutateUserResolvers = {
  async editUser(_parent, args, _context, _info) {
    const data = await User.findByIdAndUpdate(
      args.userId,
      {
        name: args.name,
        userBio: args.userBio,
        country: args.country,
        birthday: args.birthday,
        artLevel: args.artLevel,
        image: args.image,
        backdrop: args.backdrop,
        phone: args.phone,
        age: args.age,
        newUser: false,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    return data;
  },
  async editUserComm(_parent, args, _context, _info) {
    const data = await User.findByIdAndUpdate(
      args.userId,
      {
        commissionPoster: args.commissionPoster,
        commissionRates: args.commissionRates,
      },
      {
        new: true,
        runValidators: true,
      }
    );
    return data;
  },
  async likeUnlikeArtist(_parent, args, _context, _info) {
    const user = await User.exists({ _id: args.artistID });
    if (user) {
      if (args.action == "like") {
        await User.updateOne(
          { _id: args.userID },
          {
            $push: {
              likedArtists: new ObjectId(args.artistID as string) as never,
            },
          },
          {
            new: true,
            runValidators: true,
          }
        ).lean();
      } else {
        await User.updateOne(
          { _id: args.userID },
          { $pull: { likedArtists: new ObjectId(args.artistID as string) } },
          {
            new: true,
          }
        ).lean();
      }
    }
    return true;
  },
};
