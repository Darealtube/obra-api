import { ObjectId } from "mongodb";
import Post from "../model/Post";
import User from "../model/User";
import moment from "moment";
import Comment from "../model/Comment";
import History from "../model/History";
import _ from "lodash";
import relayPaginate from "../relayPaginate";
import Commission from "../model/Commission";
import Notification from "../model/Notification";
import nodemailer from "nodemailer";
import Report from "../model/Report";
import mongoose from "mongoose";
import Tag from "../model/Tag";

export const resolvers = {
  Query: {
    users(_parent, _args, _context, _info) {
      return User.find({});
    },
    async posts(_parent, args, _context, _info) {
      const posts = await Post.find({});
      const data = relayPaginate(posts, args.after, args.limit);
      return data;
    },
    userId(_parent, args, _context, _info) {
      if (!args.id) {
        return null;
      }
      return User.findById(args.id);
    },
    userName(_parent, args, _context, _info) {
      return User.findOne({ name: args.name });
    },
    postId(_parent, args, _context, _info) {
      let id: string | mongoose.Types.ObjectId;
      try {
        id = new mongoose.Types.ObjectId(args.id);
      } catch (error) {
        return null;
      }
      if (id == args.id) {
        return Post.findById(args.id);
      }
      return null;
    },
    commissionId(_parent, args, _context, _info) {
      return Commission.findById(args.id);
    },
    commentId(_parent, args, _context, _info) {
      return Comment.findById(args.id);
    },
    async recommendedPosts(_parent, args, _context, _info) {
      const post = await Post.findById(args.id);
      if (post) {
        const recommended1 = await Post.find({
          tags: { $in: [...post.tags] },
          _id: { $ne: new ObjectId(args.id as string) },
        }).sort({ date: -1 });
        const recommended2 = await Post.find({
          author: post.author,
          _id: { $ne: new ObjectId(args.id as string) },
        }).sort({ date: -1 });
        const merge = Object.values(
          recommended2.concat(recommended1).reduce((r, o) => {
            r[o.id] = o;
            return r;
          }, {})
        );
        const data = relayPaginate(merge, args.after, args.limit);
        return data;
      } else {
        return null;
      }
    },
    async newPosts(_parent, args, _context, _info) {
      const weekFromNow = moment().subtract(7, "days").toDate();
      const posts = await Post.find({ date: { $gte: weekFromNow } }).sort({
        date: -1,
      });
      const data = relayPaginate(posts, args.after, args.limit);
      return data;
    },
    async featuredPosts(_parent, args, _context, _info) {
      const posts = await Post.find({ likes: { $gt: 0 } }).sort({ likes: -1 }); // WILL MODIFY BASED ON WEBSITE'S PERFORMANCE

      const data = relayPaginate(posts, args.after, args.limit);
      return data;
    },
    async isLikedArtist(_parent, args, _context, _info) {
      const user = await User.findById(args.userID);
      const artist = await User.findOne({ name: args.artistName });

      return artist && user ? user.likedArtists.includes(artist._id) : false;
    },
    async isLikedorAddedPost(_parent, args, _context, _info) {
      let id: string | mongoose.Types.ObjectId;
      let id2: string | mongoose.Types.ObjectId;
      try {
        id = new mongoose.Types.ObjectId(args.userID);
        id2 = new mongoose.Types.ObjectId(args.postID);
      } catch (error) {
        return null;
      }
      const user = await User.findById(args.userID);
      if (user) {
        const isLiked = user.likedPosts.includes(args.postID);
        const userCart = user.cart.map((item) => item.postID);
        const isAdded = userCart.includes(args.postID);
        return { isLiked, isAdded };
      } else {
        return { isLiked: false, isAdded: false };
      }
    },
    async userExists(_parent, args, _context, _info) {
      const origUser = await User.findById(args.userId).lean();
      const user = await User.findOne({ name: args.userName }).lean();

      return user ? (user?.name === origUser?.name ? false : true) : false;
    },
    async isSameUser(_parent, args, _context, _info) {
      const userOriginal = await User.findById(args.userId);
      const userCompared = await User.findOne({ name: args.userName });

      if (!userCompared || !userOriginal) {
        return true;
      }
      return userOriginal._id.toString() == userCompared._id.toString();
    },
    async allUsersList(_parent, _args, _context, _info) {
      const users = await User.find({}).lean();
      const userList = users.map((user) => user.name);
      return userList;
    },
    async galleryExists(_parent, args, _context, _info) {
      const user = await User.findOne({ name: args.userName }).lean();
      return user ? true : false;
    },
    async reports(_parent, args, _context, _info) {
      const reports = await Report.find({ type: args.type }).sort({ date: -1 });
      const data = relayPaginate(reports, args.after, args.limit);
      return data;
    },
    async isAdmin(_parent, args, _context, _info) {
      const user = await User.findById(args.id).lean();
      return user ? user.admin : false;
    },
    async reportId(_parent, args, _context, _info) {
      let id: string | mongoose.Types.ObjectId;
      try {
        id = new mongoose.Types.ObjectId(args.reportedId);
      } catch (error) {
        return null;
      }
      if (id == args.reportedId) {
        return await Report.findById(args.reportedId);
      }
      return null;
    },
    async reportCount(_parent, _args, _context, _info) {
      const postReports = await Report.countDocuments({ type: "Post" }).lean();
      const commentReports = await Report.countDocuments({
        type: "Comment",
      }).lean();
      const userReports = await Report.countDocuments({
        type: "Report",
      }).lean();
      const bugReports = await Report.countDocuments({
        type: "Bug",
      }).lean();
      return {
        postReport: postReports,
        commentReport: commentReports,
        userReport: userReports,
        bugReport: bugReports,
        totalCount: postReports + commentReports + userReports + bugReports,
      };
    },
    async searchTags(_parent, args, _context, _info) {
      const searchResult = await Tag.find({
        name: { $regex: new RegExp(args.tag.trim(), "i") },
      }).lean();

      return searchResult;
    },
  },
  ReportedId: {
    async __resolveType(obj) {
      const user = await User.findById(obj);
      const post = await Post.findById(obj);
      const comment = await Comment.findById(obj);

      if (comment) {
        return "Comment";
      }
      if (post) {
        return "Post";
      }
      if (user) {
        return "User";
      }
      return null; // GraphQLError is thrown
    },
  },
  Comment: {
    async author(parent, _args, _context, _info) {
      return User.findById(parent.author);
    },
    async date(parent, _args, _context, _info) {
      return moment(parent.date).fromNow();
    },
  },
  Notification: {
    async commissioner(parent, _args, _context, _info) {
      return User.findById(parent.commissioner);
    },
    async date(parent, _args, _context, _info) {
      return moment(parent.date).format("l");
    },
  },
  Commission: {
    async fromUser(parent, _args, _context, _info) {
      return User.findById(parent.fromUser);
    },
    async toArtist(parent, _args, _context, _info) {
      return User.findById(parent.toArtist);
    },
    async dateIssued(parent, _args, _context, _info) {
      return moment(parent.dateIssued).format("l");
    },
    async deadline(parent, _args, _context, _info) {
      return parent.deadline ? moment(parent.deadline).format("l") : null;
    },
  },
  Report: {
    async senderId(parent, _args, _context, _info) {
      return User.findById(parent.senderId);
    },
    async reportedId(parent, _args, _context, _info) {
      if (parent.type == "Post") {
        return await Post.findById(parent.reportedId);
      }
      if (parent.type == "Comment") {
        return await Comment.findById(parent.reportedId);
      }
      if (parent.type == "User") {
        return await User.findById(parent.reportedId);
      }
    },
    async date(parent, _args, _context, _info) {
      return moment(parent.date).format("l");
    },
  },
  Cart: {
    async postID(parent, _args, _context, _info) {
      return Post.findById(parent.postID);
    },
    async dateAdded(parent, _args, _context, _info) {
      return moment(parent.dateAdded).format("l");
    },
  },
  User: {
    async likedPosts(parent, args, _context, _info) {
      const posts = await Post.find({ _id: { $in: parent.likedPosts } }).sort({
        date: -1,
      });
      const data = relayPaginate(posts, args.after, args.limit);
      return data;
    },
    async posts(parent, args, _context, _info) {
      const posts = await Post.find({ author: parent.id }).sort({
        date: -1,
      });
      const data = relayPaginate(posts, args.after, args.limit);
      return data;
    },
    async likedArtists(parent, args, _context, _info) {
      const users = await User.find({ _id: { $in: parent.likedArtists } });
      const data = relayPaginate(users, args.after, args.limit);
      return data;
    },
    async homeRecommended(parent, args, _context, _info) {
      const history = await History.find({ userId: parent.id });
      const historyArray = history.map((history) => history.viewed);
      const artists = await User.find({ posts: { $in: historyArray } });
      const artistsPostArray = _.flatten(artists.map((artist) => artist.posts));
      const posts = await Post.find({
        _id: { $in: artistsPostArray, $nin: historyArray },
      }).sort({ date: -1 });
      const data = relayPaginate(posts, args.after, args.limit);
      return data;
    },
    async commissions(parent, args, _context, _info) {
      const commissions = await Commission.find({
        _id: { $in: parent.commissions },
        accepted: true,
      }).sort({ dateIssued: -1 });
      const data = relayPaginate(commissions, args.after, args.limit);
      return data;
    },
    async pendingCommissions(parent, args, _context, _info) {
      const commissions = await Commission.find({
        _id: { $in: parent.commissions },
        accepted: false,
      }).sort({ dateIssued: -1 });
      const data = relayPaginate(commissions, args.after, args.limit);
      return data;
    },
    async yourCommissions(parent, args, _context, _info) {
      const commissions = await Commission.find({
        _id: { $in: parent.yourCommissions },
        finished: false,
      }).sort({ dateIssued: -1 });
      const data = relayPaginate(commissions, args.after, args.limit);
      return data;
    },
    async finishedCommissions(parent, args, _context, _info) {
      const commissions = await Commission.find({
        _id: { $in: parent.commissions },
        finished: true,
      }).sort({ dateIssued: -1 });
      const data = relayPaginate(commissions, args.after, args.limit);
      return data;
    },
    async yourFinishedCommissions(parent, args, _context, _info) {
      const commissions = await Commission.find({
        _id: { $in: parent.yourCommissions },
        finished: true,
      }).sort({ dateIssued: -1 });
      const data = relayPaginate(commissions, args.after, args.limit);
      return data;
    },
    async yourPendingCommissions(parent, args, _context, _info) {
      const commissions = await Commission.find({
        _id: { $in: parent.yourCommissions },
        accepted: true,
        finished: false,
      }).sort({ dateIssued: -1 });
      const data = relayPaginate(commissions, args.after, args.limit);
      return data;
    },
    async notifications(parent, args, _context, _info) {
      const notifs = await Notification.find({
        _id: { $in: parent.notifications },
      }).sort({ date: -1 });
      const read = notifs.filter((notif) => notif.read === false);
      const idList = notifs.map((notif) => notif._id);
      const data = relayPaginate(notifs, args.after, args.limit);

      return {
        ...data,
        totalUnreadCount: Math.abs(read.length),
        idList: idList,
      };
    },
    async commissionCount(parent, _args, _context, _info) {
      const commissions = await Commission.find({
        _id: { $in: parent.commissions },
        accepted: false,
      });
      return commissions.length;
    },
    async cart(parent, args, _context, _info) {
      let totalCost: number = 0;
      const data = relayPaginate(parent.cart, args.after, args.limit);
      const costs = parent.cart.map((item) => item.cost);
      const idList = parent.cart.map((item) => item._id);
      if (parent.cart.length != 0) {
        totalCost = costs?.reduce((a, b) => a + b);
      }
      return { ...data, totalCost, idList };
    },
  },
  Post: {
    async author(parent, _args, _context, _info) {
      return User.findById(parent.author);
    },
    async tags(parent, _args, _context, _info) {
      const modTag = parent.tags.map((tag: string) => tag.toUpperCase());
      const tagList = await Tag.find({ name: { $in: modTag } }).lean();

      return tagList;
    },
    async comments(parent, args, _context, _info) {
      const comments = await Comment.find({
        _id: { $in: parent.comments },
      }).sort({ date: -1 });

      const data = relayPaginate(comments, args.after, args.limit);
      return data;
    },
    async date(parent, _args, _context, _info) {
      return moment(parent.date).format("l");
    },
  },
  Mutation: {
    async likePost(_parent, args, _context, _info) {
      const post = await Post.findById(args.postId).lean();

      if (post) {
        await User.updateOne(
          { _id: args.userID },
          {
            $addToSet: {
              likedPosts: new ObjectId(args.postId as string) as never,
            },
          },
          {
            new: true,
            runValidators: true,
          }
        ).lean();

        await Post.updateOne(
          { _id: args.postId },
          {
            $inc: {
              likes: 1 as never,
            },
          },
          {
            new: true,
          }
        ).lean();
      }

      return true;
    },
    async unlikePost(_parent, args, _context, _info) {
      const post = await Post.findById(args.postId).lean();

      if (post) {
        await User.updateOne(
          { _id: args.userID },
          {
            $pull: {
              likedPosts: new ObjectId(args.postId as string),
            },
          },
          {
            new: true,
          }
        ).lean();
        await Post.updateOne(
          { _id: args.postId },
          {
            $inc: {
              likes: -1 as never,
            },
          },
          {
            new: true,
          }
        ).lean();
      }

      return true;
    },
    async editPost(_parent, args, _context, _info) {
      const origPost = await Post.findById(args.postId);
      const newTags = args.tags.filter((tag) => !origPost.tags.includes(tag));
      const post = await Post.findByIdAndUpdate(
        args.postId,
        {
          title: args.title,
          description: args.description,
          tags: args.tags,
        },
        { new: true }
      );

      await Tag.bulkWrite(
        newTags.map((tag: string) => ({
          updateOne: {
            filter: { name: tag },
            update: {
              $inc: {
                artCount: 1 as never,
              },
            },
            upsert: true,
          },
        }))
      );

      await Tag.updateMany(
        {
          name: { $in: origPost.tags, $nin: post.tags },
        },
        {
          $inc: {
            artCount: -1 as never,
          },
        }
      );

      await Tag.deleteMany({ artCount: 0 });

      return post;
    },
    async deletePost(_parent, args, _context, _info) {
      const post = await Post.findById(args.postId);
      const tags = post.tags.map((tag: string) => tag.toUpperCase());
      await Post.deleteOne({ _id: args.postId });
      await Comment.deleteMany({ postID: args.postId });
      await Report.deleteMany({ reportedId: args.postId });
      await User.findOneAndUpdate(
        { _id: post.author },
        { $pull: { posts: new ObjectId(args.postId as string) } },
        {
          new: true,
        }
      );
      await User.updateMany(
        { likedPosts: { $in: [new ObjectId(args.postId as string)] } },
        { $pull: { likedPosts: new ObjectId(args.postId as string) } },
        {
          new: true,
        }
      );
      await Tag.updateMany(
        {
          name: { $in: tags },
        },
        {
          $inc: {
            artCount: -1 as never,
          },
        }
      );
      return true;
    },
    async createPost(_parent, args, _context, _info) {
      const post = await Post.create(args); // from body (for now)
      await User.findOneAndUpdate(
        { _id: post.author },
        // @ts-ignore
        { $push: { posts: post._id } }
      );

      await Tag.bulkWrite(
        args.tags.map((tag: string) => ({
          updateOne: {
            filter: { name: tag },
            update: {
              $inc: {
                artCount: 1 as never,
              },
            },
            upsert: true,
          },
        }))
      );

      return true;
    },
    async createComment(_parent, args, _context, _info) {
      const comment = await Comment.create(args);
      await Post.findByIdAndUpdate(args.postID, {
        $push: { comments: comment._id as never },
      });
      return comment;
    },
    async deleteComment(_parent, args, _context, _info) {
      await Comment.deleteOne({ _id: args.commentID });

      await Post.updateOne(
        { comments: { $in: [new ObjectId(args.commentID as string)] } },
        { $pull: { comments: new ObjectId(args.commentID as string) } }
      );

      return true;
    },
    async configUser(_parent, args, _context, _info) {
      await User.findByIdAndUpdate(
        args.userId,
        {
          name: args.name,
          age: args.age,
          country: args.country,
          language: args.language,
          birthday: args.birthday,
          phone: args.phone,
          artLevel: args.artLevel,
          artStyles: args.artStyles,
          artKinds: args.artKinds,
          newUser: false,
        },
        {
          new: true,
          runValidators: true,
        }
      );
      return true;
    },
    async editUser(_parent, args, _context, _info) {
      const data = await User.findByIdAndUpdate(
        args.userId,
        {
          name: args.name,
          userBio: args.userBio,
          country: args.country,
          birthday: args.birthday,
          artLevel: args.artLevel,
          artStyles: args.artStyles,
          artKinds: args.artKinds,
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
    async readNotif(_parent, args, _context, _info) {
      await Notification.updateMany(
        { _id: { $in: args.notifArray } },
        {
          read: true,
        }
      );
      return true;
    },
    async likeArtist(_parent, args, _context, _info) {
      const user = await User.findById(args.artistID).lean();

      if (user) {
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
      }

      return true;
    },
    async unlikeArtist(_parent, args, _context, _info) {
      const user = await User.findById(args.artistID).lean();

      if (user) {
        await User.updateOne(
          { _id: args.userID },
          { $pull: { likedArtists: new ObjectId(args.artistID as string) } },
          {
            new: true,
          }
        ).lean();
      }

      return true;
    },
    async viewPost(_parent, args, _context, _info) {
      await History.findOneAndUpdate(
        { viewed: args.viewed },
        {
          userId: args.userId,
          viewed: args.viewed,
          lastDateViewed: moment().toDate(),
        },
        {
          upsert: true,
          new: true,
          runValidators: true,
        }
      );
      return true;
    },
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
    async deleteNotification(_parent, args, _context, _info) {
      await Notification.findByIdAndDelete(args.notifId);
      await User.findByIdAndUpdate(args.userId, {
        $pull: { notifications: new ObjectId(args.notifId as string) },
      });
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
    async acceptCommission(_parent, args, _context, _info) {
      const commission = await Commission.findOneAndUpdate(
        { _id: args.commissionId },
        { accepted: true },
        { new: true }
      );
      const user = await User.findById(commission.toArtist).lean();

      const notification = await Notification.create({
        commissioner: user._id,
        description: `Your commission to ${
          user.name
        } has been accepted. Message: ${args.message ? args.message : ""}`,
        read: false,
      });

      await User.updateOne(
        {
          yourCommissions: { $in: [new ObjectId(args.commissionId as string)] },
        },
        {
          $push: { notifications: notification._id },
        }
      );

      return commission;
    },
    async finishCommission(_parent, args, _context, _info) {
      const commission = await Commission.findByIdAndUpdate(
        args.commissionId,
        {
          finished: true,
          finishedArt: args.finishedArt,
          finishedwatermarkArt: args.finishedwatermarkArt,
          message: args.message,
        },
        { new: true }
      );

      const user = await User.findByIdAndUpdate(commission.toArtist._id, {
        $pull: {
          commissions: new mongoose.Types.ObjectId(args.commissionId as string),
        },
      });

      const notification = await Notification.create({
        commissioner: commission.toArtist._id,
        description: `Your commission to ${
          user.name
        } has been finished. Message: ${args.message ? args.message : ""}`,
        read: false,
      });

      await User.updateOne(
        { _id: commission.fromUser._id },
        {
          $push: { notifications: notification._id },
        }
      );

      return true;
    },
    async sendReport(_parent, args, _context, _info) {
      let reported;
      switch (args.type) {
        case "Post":
          reported = await Post.findById(args.reportedId).lean();
          break;
        case "Comment":
          reported = await Comment.findById(args.reportedId).lean();
          break;
        case "User":
          reported = await User.findById(args.reportedId).lean();
          break;
        case "Bug":
          await Report.create(args);
          return true;
        default:
          return true;
      }

      if (reported) {
        await Report.create(args);
      }

      return true;
    },
    async deleteReport(_parent, args, _context, _info) {
      await Report.findByIdAndDelete(args.reportId);
      return true;
    },
    async sendWarning(_parent, args, _context, _info) {
      await Report.findByIdAndDelete(args.reportId);

      // create reusable transporter object using the default SMTP transport
      const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true, // use SSL
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_PASSWORD,
        },
      });

      // send mail with defined transport object
      await transporter.sendMail({
        replyTo: `${process.env.GMAIL_USER}`,
        from: "Obra Website", // sender address
        to: `${args.reportedEmail}`, // list of receivers
        subject: args.title, // Subject line
        text: `${args.description} <b>Reason: ${args.reason}</b>`, // plain text body
      });

      return true;
    },
    async addToCart(_parent, args, _context, _info) {
      await User.updateOne(
        { _id: args.userID },
        {
          $push: {
            cart: {
              _id: new mongoose.Types.ObjectId(),
              postID: args.postID,
              dateAdded: moment().toDate(),
              cost: args.cost,
            },
          },
        }
      );
      return true;
    },
    async unaddToCart(_parent, args, _context, _info) {
      await User.updateOne(
        { _id: args.userID },
        {
          $pull: {
            cart: {
              postID: args.postID,
            },
          },
        }
      );
      return true;
    },
    async removeFromCart(_parent, args, _context, _info) {
      let totalCost: number = 0;
      const user = await User.findByIdAndUpdate(
        args.userID,
        {
          $pull: {
            cart: {
              _id: new mongoose.Types.ObjectId(args.itemID),
            },
          },
        },
        { new: true }
      );
      const costs = user.cart.map((item) => item.cost);
      const idList = user.cart.map((item) => item._id);
      if (user.cart.length != 0) {
        totalCost = costs?.reduce((a, b) => a + b);
      }

      return { totalCost, idList };
    },
    async removeSelectedFromCart(_parent, args, _context, _info) {
      let totalCost: number = 0;
      const user = await User.findByIdAndUpdate(
        args.userID,
        {
          $pull: {
            cart: {
              _id: { $in: args.selected },
            },
          },
        },
        { new: true }
      );

      const costs = user.cart.map((item) => item.cost);
      const idList = user.cart.map((item) => item._id);
      if (user.cart.length != 0) {
        totalCost = costs?.reduce((a, b) => a + b);
      }

      return { totalCost, idList };
    },
  },
};
