export type TagType = {
  _id: string;
  name: string;
  artCount: number;
};

export type PostType = {
  _id: string;
  date: string;
  tags: string[];
  title: string;
  description: string;
  art: string;
  watermarkArt: string;
  author: string;
  likes: number;
  comments: string[];
  width: number;
  height: number;
};

export type CommentType = {
  _id: string;
  postID: string;
  date: string;
  author: string;
  content: string;
};

export type UserType = {
  _id: string;
  name: string;
  email: string;
  image: string;
  createdAt: string;
  updatedAt: string;
  posts: string[];
  likedPosts: string[];
  notifications: string[];
  age: string;
  country: string;
  birthday: string;
  phone: string;
  newUser: boolean;
  tutorial: boolean;
  artLevel: string;
  userBio: string;
  backdrop: string;
  commissions: string[];
  yourCommissions: string[];
  admin: boolean;
  commissionPoster: string;
  commissionRates: RatesType[];
  likedArtists: string[];
};

export type CommissionType = {
  _id: string;
  fromUser: string;
  toArtist: string;
  title: string;
  description: string;
  sampleArt: string;
  width: number;
  height: number;
  deadline: string;
  dateIssued: string;
  price: number;
  rates: string;
};

export type NotifType = {
  _id: string;
  commissionId: string;
  commissioner: string;
  date: string;
  description: string;
  read: boolean;
};

export type RatesType = {
  type: string;
  price: number;
};

export type ReportType = {
  _id: string;
  senderId: string;
  reportedId: string;
  type: string;
  date: string;
  title: string;
  description: string;
  reason: string;
  bugVid: string;
  vidFormat: string;
};
