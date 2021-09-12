import { ObjectId } from "mongodb";
import Post from "../../model/Post";
import _ from "lodash";
import relayPaginate, { Decursorify } from "../../relayPaginate";
import mongoose from "mongoose";
import { PostType } from "../../types";

export const queryPostResolvers = {
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
  async recommendedPosts(_parent, args, _context, _info) {
    const post: PostType = await Post.findById(args.id);
    if (post) {
      const recommended1: PostType[] = await Post.find({
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
    const posts: PostType[] = await Post.find({
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
};
