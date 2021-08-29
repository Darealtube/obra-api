import { ObjectId } from "mongodb";
import Post from "../model/Post";
import User from "../model/User";
import moment from "moment";
import Comment from "../model/Comment";
import _ from "lodash";
import relayPaginate, { Decursorify } from "../relayPaginate";
import Commission from "../model/Commission";
import Notification from "../model/Notification";
import nodemailer from "nodemailer";
import Report from "../model/Report";
import mongoose from "mongoose";
import Tag from "../model/Tag";

export const resolvers = {
  Query: {
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
          ...(args.after && { date: { $lt: Decursorify(args.after) } }),
        })
          .sort({ date: -1, _id: -1 })
          .limit(args.limit);
        const data = relayPaginate({
          finalArray: recommended1,
          cursorIdentifier: "date",
          limit: args.limit,
        });
        return data;
      } else {
        return null;
      }
    },
    async trendingPosts(_parent, args, _context, _info) {
      const posts = await Post.find({
        likes: { $gt: 0 },
        ...(args.after && { date: { $lt: Decursorify(args.after) } }),
      })
        .sort({
          date: -1,
          likes: -1,
          _id: -1,
        })
        .limit(args.limit); // WILL MODIFY BASED ON WEBSITE'S PERFORMANCE

      const data = relayPaginate({
        finalArray: posts,
        cursorIdentifier: "date",
        limit: args.limit,
      });
      return data;
    },
    async popularCategories(_parent, args, _context, _info) {
      const topCategories = await Tag.find({ artCount: { $gt: 0 } })
        .sort({ artCount: -1 })
        .limit(25);
      return topCategories;
    },
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
      const reports = await Report.find({
        type: args.type,
        ...(args.after && { date: { $lt: Decursorify(args.after) } }),
      })
        .sort({ date: -1, _id: -1 })
        .limit(args.limit);
      const data = relayPaginate({
        finalArray: reports,
        cursorIdentifier: "date",
        limit: args.limit,
      });
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
    async search(_parent, args, _context, _info) {
      if (args.type == "user") {
        const searchUserResult = await User.find({
          name: {
            $regex: new RegExp(args.key.trim(), "i"),
            ...(args.after && { $gt: Decursorify(args.after) }),
          },
        })
          .sort({ name: 1 })
          .limit(args.limit);

        const data = relayPaginate({
          finalArray: searchUserResult,
          limit: args.limit,
          cursorIdentifier: "name",
        });

        return { type: args.type, ...data };
      } else if (args.type == "tag") {
        if (!args.key.trim()) {
          return {
            type: args.type,
            edges: [],
            pageInfo: { hasNextPage: false, endCursor: null },
          };
        } else {
          const searchTagResult = await Tag.find({
            name: { $regex: new RegExp(args.key.trim(), "i") },
            artCount: { $gt: 0 },
          })
            .sort({ artCount: -1 })
            .limit(10)
            .lean();

          const data = relayPaginate({
            finalArray: searchTagResult,
            limit: args.limit,
            cursorIdentifier: "name",
          });

          return { type: args.type, ...data };
        }
      } else {
        const searchCategoryResult = await Tag.find({
          name: {
            $regex: new RegExp(args.key.trim(), "i"),
            ...(args.after && { $gt: Decursorify(args.after) }),
          },
          artCount: { $gt: 0 },
        })
          .sort({ name: 1 })
          .limit(args.limit);

        const data = relayPaginate({
          finalArray: searchCategoryResult,
          limit: args.limit,
          cursorIdentifier: "name",
        });

        return { type: args.type, ...data };
      }
    },
    async categoryPosts(_parent, args, _context, _info) {
      const categoryPosts = await Post.find({
        tags: { $in: args.category.toUpperCase().trim() },
        ...(args.after && { date: { $lt: Decursorify(args.after) } }),
      })
        .sort({ date: -1, _id: -1 })
        .limit(args.limit);
      const categoryPostCount = await Post.countDocuments({
        tags: { $in: args.category.toUpperCase().trim() },
      });

      const data = relayPaginate({
        finalArray: categoryPosts,
        cursorIdentifier: "date",
        limit: args.limit,
      });
      return { ...data, totalCount: categoryPostCount };
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
  SearchResultType: {
    async __resolveType(obj) {
      switch (obj.type) {
        case "tag":
          return "TagConnection";
        case "user":
          return "UserConnection";
        case "category":
          return "CategoryConnection";
        default:
          return null;
      }
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
  User: {
    async artCount(parent, _args, _context, _info) {
      const artCount = await Post.countDocuments({
        author: parent.id,
      });
      return artCount;
    },
    async likedPosts(parent, args, _context, _info) {
      const posts = await Post.find({
        _id: { $in: parent.likedPosts },
        ...(args.after && { date: { $lt: Decursorify(args.after) } }),
      })
        .sort({
          date: -1,
          _id: -1,
        })
        .limit(args.limit);
      const data = relayPaginate({
        finalArray: posts,
        cursorIdentifier: "date",
        limit: args.limit,
      });
      return data;
    },
    async posts(parent, args, _context, _info) {
      const posts = await Post.find({
        author: parent.id,
        ...(args.after && { date: { $lt: Decursorify(args.after) } }),
      })
        .sort({
          date: -1,
          _id: -1,
        })
        .limit(args.limit);
      const data = relayPaginate({
        finalArray: posts,
        cursorIdentifier: "date",
        limit: args.limit,
      });
      return data;
    },
    async commissions(parent, args, _context, _info) {
      const commissions = await Commission.find({
        _id: { $in: parent.commissions },
        ...(args.after && {
          dateIssued: { $lt: Decursorify(args.after) },
        }),
      })
        .sort({ dateIssued: -1, _id: -1 })
        .limit(args.limit);
      const data = relayPaginate({
        finalArray: commissions,
        limit: args.limit,
        cursorIdentifier: "dateIssued",
      });
      return data;
    },
    async yourCommissions(parent, args, _context, _info) {
      const commissions = await Commission.find({
        _id: { $in: parent.yourCommissions },
        ...(args.after && {
          dateIssued: { $lt: Decursorify(args.after) },
        }),
      })
        .sort({ dateIssued: -1, _id: -1 })
        .limit(args.limit);
      const data = relayPaginate({
        finalArray: commissions,
        limit: args.limit,
        cursorIdentifier: "dateIssued",
      });
      return data;
    },
    async notifications(parent, args, _context, _info) {
      const notifs = await Notification.find({
        _id: { $in: parent.notifications },
        ...(args.after && { date: { $lt: Decursorify(args.after) } }),
      })
        .sort({ date: -1, _id: -1 })
        .limit(args.limit);
      const notifCount = await Notification.countDocuments({
        _id: { $in: parent.notifications },
      });
      const unread = notifs.filter((notif) => notif.read === false);
      const idList = notifs.map((notif) => notif._id);
      const data = relayPaginate({
        finalArray: notifs,
        limit: args.limit,
        cursorIdentifier: "date",
      });

      return {
        ...data,
        totalCount: notifCount,
        totalUnreadCount: Math.abs(unread.length),
        idList: idList,
      };
    },
    async commissionCount(parent, _args, _context, _info) {
      const commissions = await Commission.find({
        _id: { $in: parent.commissions },
      });
      return commissions.length;
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
        ...(args.after && { date: { $lt: Decursorify(args.after) } }),
      })
        .sort({ date: -1, _id: -1 })
        .limit(args.limit);
      const commentCount = await Comment.countDocuments({
        _id: { $in: parent.comments },
      });

      const data = relayPaginate({
        finalArray: comments,
        cursorIdentifier: "date",
        limit: args.limit,
      });
      return { ...data, totalCount: commentCount };
    },
    async date(parent, _args, _context, _info) {
      return moment(parent.date).format("l");
    },
  },
  Mutation: {
    async likeUnlikePost(_parent, args, _context, _info) {
      const post = await Post.exists({ _id: args.postId });

      if (post) {
        if (args.action == "like") {
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
        } else {
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
    async readNotif(_parent, args, _context, _info) {
      await Notification.updateMany(
        { _id: { $in: args.notifArray } },
        {
          read: true,
        }
      );
      return true;
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
  },
};
