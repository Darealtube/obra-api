export type TagType = {
  id: string;
  name: string;
  artCount: number;
};

export type PostType = {
  id: string;
  date: string;
  tags: TagType[];
  title: string;
  description: string;
  art: string;
  watermarkArt: string;
  author: string;
  likes: number;
  comments: CommentType[];
  width: number;
  height: number;
};

export type CommentType = {
  id: string;
  postID: string;
  date: string;
  author: string;
  content: string;
};

export type UserType = {
  id: string;
  name: string;
  email: string;
  image: string;
  createdAt: string;
  updatedAt: string;
  posts: PostType[];
  likedPosts: PostType[];
  notifications: NotifType[];
  age: string;
  country: string;
  birthday: string;
  phone: string;
  newUser: boolean;
  tutorial: boolean;
  artLevel: string;
  userBio: string;
  backdrop: string;
  commissions: CommissionType[];
  yourCommissions: CommissionType[];
  admin: boolean;
  commissionPoster: string;
  commissionRates: RatesType[];
};

export type CommissionType = {
  id: string;
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
  id: string;
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
