import Post from "../model/Post";
import User from "../model/User";
import moment from "moment";
import Comment from "../model/Comment";
import _ from "lodash";
import relayPaginate, { Decursorify } from "../relayPaginate";
import Commission from "../model/Commission";
import Notification from "../model/Notification";
import Tag from "../model/Tag";
import { queryUserResolvers } from "./QueryResolvers/qUserResolvers";
import { queryPostResolvers } from "./QueryResolvers/qPostResolvers";
import { queryCategoryResolvers } from "./QueryResolvers/qCategoryResolvers";
import { queryValidateResolvers } from "./QueryResolvers/qValidateResolvers";
import { queryReportResolvers } from "./QueryResolvers/qReportResolvers";
import { mutatePostResolvers } from "./MutationResolvers.ts/mPostResolvers";
import { mutateCommentResolvers } from "./MutationResolvers.ts/mCommentResolvers";
import { mutateUserResolvers } from "./MutationResolvers.ts/mUserResolvers";
import { mutateNotifResolvers } from "./MutationResolvers.ts/mNotifResolvers";
import { mutateReportResolvers } from "./MutationResolvers.ts/mReportResolvers";
import { mutateCommissionResolvers } from "./MutationResolvers.ts/mCommsResolvers";
import {
  CommentType,
  CommissionType,
  NotifType,
  PostType,
  TagType,
  UserType,
} from "../types";

export const resolvers = {
  Query: {
    commissionId(_parent, args, _context, _info) {
      return Commission.findById(args.id);
    },
    commentId(_parent, args, _context, _info) {
      return Comment.findById(args.id);
    },
    ...queryUserResolvers,
    ...queryPostResolvers,
    ...queryCategoryResolvers,
    ...queryValidateResolvers,
    ...queryReportResolvers,
  },
  ReportedId: {
    async __resolveType(obj) {
      const user: UserType = await User.findById(obj);
      const post: PostType = await Post.findById(obj);
      const comment: CommentType = await Comment.findById(obj);

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
      const posts: PostType[] = await Post.find({
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
      const posts: PostType[] = await Post.find({
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
      const commissions: CommissionType[] = await Commission.find({
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
      const commissions: CommissionType[] = await Commission.find({
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
      const notifs: NotifType[] = await Notification.find({
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
      const commissions: CommissionType[] = await Commission.find({
        _id: { $in: parent.commissions },
      });
      return commissions.length;
    },
    async isLikedBy(parent, args, _context, _info) {
      const liked: UserType = await User.findOne({
        _id: args.userId,
        likedArtists: { $in: [parent._id] },
      }).lean();
      return liked ? true : false;
    },
  },
  Post: {
    async author(parent, _args, _context, _info) {
      return User.findById(parent.author);
    },
    async tags(parent, _args, _context, _info) {
      const modTag: TagType[] = parent.tags.map((tag: string) =>
        tag.toUpperCase()
      );
      const tagList: TagType[] = await Tag.find({
        name: { $in: modTag },
      }).lean();

      return tagList;
    },
    async comments(parent, args, _context, _info) {
      const comments: CommentType[] = await Comment.find({
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
    ...mutatePostResolvers,
    ...mutateCommentResolvers,
    ...mutateUserResolvers,
    ...mutateCommissionResolvers,
    ...mutateNotifResolvers,
    ...mutateReportResolvers,
  },
};
