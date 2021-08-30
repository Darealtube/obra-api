import Post from "../../model/Post";
import Report from "../../model/Report";
import User from "../../model/User";
import Comment from "../../model/Comment";
import nodemailer from "nodemailer";

export const mutateReportResolvers = {
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
};
