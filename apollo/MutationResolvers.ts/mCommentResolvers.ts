import { ObjectId } from "mongodb";
import Post from "../../model/Post";
import Comment from "../../model/Comment";

export const mutateCommentResolvers = {
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
};
