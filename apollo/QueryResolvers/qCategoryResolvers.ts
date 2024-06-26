import { LeanDocument } from "mongoose";
import Post from "../../model/Post";
import Tag from "../../model/Tag";
import User from "../../model/User";
import relayPaginate, { Decursorify } from "../../relayPaginate";
import { PostType, TagType, UserType } from "../../types";

type searchArgs = {
  key: string;
  type: "user" | "tag" | "category";
  after?: string;
  limit?: number;
};

type categoryPostsArgs = {
  category: string;
  after?: string;
  limit?: number;
};

export const queryCategoryResolvers = {
  async popularCategories(_parent, _args, _context, _info) {
    const topCategories: TagType[] = await Tag.find({ artCount: { $gt: 0 } })
      .sort({ artCount: -1 })
      .limit(25);
    return topCategories;
  },
  async search(_parent, args: searchArgs, _context, _info) {
    if (args.type == "user") {
      const searchUserResult: UserType[] = await User.find({
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
        const searchTagResult: LeanDocument<TagType>[] = await Tag.find({
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
      const searchCategoryResult: TagType[] = await Tag.find({
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
  async categoryPosts(_parent, args: categoryPostsArgs, _context, _info) {
    const categoryPosts: PostType[] = await Post.find({
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
};
