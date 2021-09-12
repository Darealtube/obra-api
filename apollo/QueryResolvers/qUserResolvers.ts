import Commission from "../../model/Commission";
import Notification from "../../model/Notification";
import Report from "../../model/Report";
import User from "../../model/User";
import { UserType } from "../../types";

export const queryUserResolvers = {
  async userId(_parent, args, _context, _info) {
    if (!args.id) {
      return null;
    }
    return User.findById(args.id);
  },
  async userName(_parent, args, _context, _info) {
    return User.findOne({ name: args.name });
  },
  async drawerCounts(_parent, args, _context, _info) {
    let issues: number;
    const user: UserType = await User.findById(args.userId);
    const commissions = Commission.countDocuments({
      toArtist: args.userId,
    });
    const unreadNotif = Notification.countDocuments({
      _id: { $in: [...user.notifications] },
    });

    if (user.admin) {
      issues = await Report.countDocuments({});
    }

    return {
      commissions,
      unreadNotif,
      issues,
    };
  },
};
