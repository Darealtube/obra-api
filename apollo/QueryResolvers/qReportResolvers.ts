import Report from "../../model/Report";
import relayPaginate, { Decursorify } from "../../relayPaginate";
import mongoose from "mongoose";

export const queryReportResolvers = {
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
};
