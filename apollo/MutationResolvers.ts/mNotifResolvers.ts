import { ObjectId } from "mongodb";
import Notification from "../../model/Notification";
import User from "../../model/User";

export const mutateNotifResolvers = {
  async readNotif(_parent, args, _context, _info) {
    await Notification.updateMany(
      { _id: { $in: args.notifArray } },
      {
        read: true,
      }
    );
    return true;
  },
  async deleteNotification(_parent, args, _context, _info) {
    await Notification.findByIdAndDelete(args.notifId);
    await User.findByIdAndUpdate(args.userId, {
      $pull: { notifications: new ObjectId(args.notifId as string) },
    });
    return true;
  },
};
