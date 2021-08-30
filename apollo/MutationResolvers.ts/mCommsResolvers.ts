import moment from "moment";
import { ObjectId } from "mongodb";
import Commission from "../../model/Commission";
import User from "../../model/User";
import Notification from "../../model/Notification";

export const mutateCommissionResolvers = {
  async commissionArtist(_parent, args, _context, _info) {
    const toArtist = await User.findOne({ name: args.artistName }).lean();
    const deadline = args.deadline
      ? moment().add(args.deadline, "d").toDate()
      : null;

    if (toArtist) {
      const commission = await Commission.create({
        fromUser: args.userId,
        toArtist: toArtist._id,
        title: args.title,
        description: args.description,
        sampleArt: args.sampleArt,
        width: args.width,
        height: args.height,
        deadline,
        price: args.price,
        rates: args.rates,
      });

      const fromUser = await User.findByIdAndUpdate(
        args.userId,
        {
          $push: {
            yourCommissions: new ObjectId(commission._id as string) as never,
          },
        },
        {
          new: true,
        }
      );

      const notification = await Notification.create({
        commissionId: commission._id,
        commissioner: args.userId,
        description: `You have a new commission request from ${fromUser.name}`,
        read: false,
      });

      await User.findByIdAndUpdate(
        toArtist._id,
        {
          $push: {
            commissions: new ObjectId(commission._id as string) as never,
            notifications: notification._id,
          },
        },
        {
          new: true,
        }
      );
    }

    return true;
  },

  async deleteCommission(_parent, args, _context, _info) {
    await Commission.deleteOne({ _id: args.commissionId });

    const user = await User.findOneAndUpdate(
      { commissions: { $in: [new ObjectId(args.commissionId as string)] } },
      { $pull: { commissions: new ObjectId(args.commissionId as string) } }
    );

    await Notification.deleteOne({
      _id: { $in: user.notifications },
      commissionId: args.commissionId,
    });

    const notification = await Notification.create({
      commissioner: user._id,
      description: `Your commission to ${
        user.name
      } has been rejected. Reason: ${args.reason ? args.reason : ""}`,
      read: false,
    });

    await User.updateOne(
      {
        yourCommissions: { $in: [new ObjectId(args.commissionId as string)] },
      },
      {
        $pull: { yourCommissions: new ObjectId(args.commissionId as string) },
        $push: { notifications: notification._id },
      }
    );
    return true;
  },
};
