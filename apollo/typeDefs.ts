import { gql } from "apollo-server-micro";

export const typeDefs = gql`
  type User {
    id: ID
    name: String
    email: String
    image: String
    createdAt: String
    updatedAt: String
    posts(after: String, limit: Int): PostConnection
    likedPosts(after: String, limit: Int): PostConnection
    notifications(after: String, limit: Int): NotificationConnection
    username: String
    age: String
    country: String
    birthday: String
    phone: String
    newUser: Boolean
    tutorial: Boolean
    artLevel: String
    userBio: String
    backdrop: String
    artCount: Int
    commissions(after: String, limit: Int): CommissionConnection
    yourCommissions(after: String, limit: Int): CommissionConnection
    commissionCount: Int
    admin: Boolean
    commissionPoster: String
    commissionRates: [Rates]
    isLikedBy(userId: ID!): Boolean
  }

  type Post {
    id: ID!
    date: String!
    tags: [Tag]
    title: String!
    description: String!
    art: String!
    watermarkArt: String!
    author: User
    likes: Int
    comments(after: String, limit: Int): CommentConnection
    width: Int
    height: Int
  }

  type Commission {
    id: ID!
    fromUser: User!
    toArtist: User!
    title: String!
    description: String!
    sampleArt: String!
    width: Int!
    height: Int!
    deadline: String
    dateIssued: String!
    price: Float!
    rates: [String]!
  }

  type Comment {
    id: ID!
    postID: ID!
    date: String!
    author: User
    content: String!
  }

  type Rates {
    type: String
    price: Float
  }

  input RatesInput {
    type: String
    price: Float
  }

  type Report {
    id: ID!
    senderId: User!
    reportedId: ReportedId
    type: String!
    date: String!
    title: String
    description: String!
    reason: String!
    bugVid: String
    vidFormat: String
  }

  union ReportedId = Post | User | Comment
  union SearchResultType = TagConnection | CategoryConnection | UserConnection

  type Query {
    userId(id: ID): User
    userName(name: String!): User
    postId(id: ID!): Post
    recommendedPosts(id: ID!, after: String, limit: Int): PostConnection
    trendingPosts(after: String, limit: Int): PostConnection
    commissionId(id: ID!): Commission
    commentId(id: ID!): Comment
    isLikedArtist(userID: ID, artistName: String!): Boolean
    isLikedPost(postID: ID!, userID: ID): Boolean
    userExists(userName: String, userId: ID!): Boolean
    reports(after: String, limit: Int, type: String!): ReportConnection
    isAdmin(id: ID): Boolean
    reportId(reportedId: ID!): Report
    reportCount: ReportCount
    search(
      key: String!
      type: String!
      after: String
      limit: Int
    ): SearchResultType
    categoryPosts(category: String!, after: String, limit: Int): PostConnection
    popularCategories: [Category]
    drawerCounts(userId: ID!): DrawerCounts
  }

  type DrawerCounts {
    unreadNotif: Int
    issues: Int
    commissions: Int
  }

  type Tag {
    name: String
    artCount: Int
  }

  type Category {
    id: ID
    name: String
    artCount: Int
  }

  type ReportCount {
    totalCount: Int
    postReport: Int
    commentReport: Int
    userReport: Int
    bugReport: Int
  }

  type Notification {
    id: ID!
    commissionId: ID
    commissioner: User
    date: String
    description: String
    read: Boolean
  }

  type Mutation {
    editPost(
      postId: ID
      title: String!
      description: String!
      tags: [String!]
    ): Post
    createPost(
      tags: [String]
      title: String!
      description: String!
      art: String!
      watermarkArt: String!
      author: ID!
      width: Int!
      height: Int!
    ): Boolean!
    likeUnlikePost(postId: ID!, userID: ID!, action: String!): Boolean!
    likeUnlikeArtist(artistID: ID!, userID: ID!, action: String!): Boolean!
    deletePost(postId: ID!): Boolean!
    editUser(
      userId: ID!
      name: String!
      country: String!
      birthday: String!
      artLevel: String!
      userBio: String
      image: String
      backdrop: String
      phone: String
      age: String
    ): User
    editUserComm(
      userId: ID!
      commissionPoster: String!
      commissionRates: [RatesInput]
    ): User
    readNotif(notifArray: [ID!]): Boolean!
    createComment(postID: ID!, author: ID!, content: String!): Comment!
    deleteComment(commentID: ID!): Boolean!
    commissionArtist(
      artistName: String!
      userId: ID!
      title: String!
      description: String!
      sampleArt: String!
      height: Int!
      width: Int!
      deadline: Int
      price: Float!
      rates: [String]!
    ): Boolean!
    deleteNotification(notifId: ID!, userId: ID!): Boolean!
    deleteCommission(commissionId: ID!, reason: String): Boolean!
    sendReport(
      senderId: ID!
      reportedId: ID
      type: String!
      title: String
      description: String!
      reason: String!
      bugVid: String
      vidFormat: String
    ): Boolean!
    sendWarning(
      reportId: ID!
      reportedEmail: String!
      title: String!
      description: String!
      reason: String!
    ): Boolean!
    deleteReport(reportId: ID!): Boolean!
  }

  type PostConnection {
    totalCount: Int
    pageInfo: PageInfo
    edges: [PostEdge]
  }

  type UserConnection {
    pageInfo: PageInfo
    edges: [UserEdge]
  }

  type CommentConnection {
    totalCount: Int
    pageInfo: PageInfo
    edges: [CommentEdge]
  }

  type CommissionConnection {
    pageInfo: PageInfo
    edges: [CommissionEdge]
  }

  type NotificationConnection {
    idList: [ID!]
    totalCount: Int
    totalUnreadCount: Int
    pageInfo: PageInfo
    edges: [NotificationEdge]
  }

  type ReportConnection {
    pageInfo: PageInfo
    edges: [ReportEdge]
  }

  type CategoryConnection {
    pageInfo: PageInfo
    edges: [CategoryEdge]
  }

  type TagConnection {
    pageInfo: PageInfo
    edges: [TagEdge]
  }

  type TagEdge {
    node: Tag
  }

  type CategoryEdge {
    node: Category
  }

  type ReportEdge {
    node: Report
  }

  type NotificationEdge {
    node: Notification
  }

  type CommissionEdge {
    node: Commission
  }

  type CommentEdge {
    node: Comment
  }

  type PostEdge {
    node: Post
  }

  type UserEdge {
    node: User
  }

  type PageInfo {
    endCursor: ID
    hasNextPage: Boolean
  }
`;
