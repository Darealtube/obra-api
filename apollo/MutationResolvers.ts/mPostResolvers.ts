import { ObjectId } from "mongodb";
import Post from "../../model/Post";
import Report from "../../model/Report";
import Tag from "../../model/Tag";
import User from "../../model/User";
import Comment from "../../model/Comment";

export const mutatePostResolvers = {
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
        name: { $in: post.tags },
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
};
