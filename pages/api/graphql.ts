import { ApolloServer } from "apollo-server-micro";
import { schema } from "../../apollo/schema";
import mongoose from "mongoose";

function parseCookies(str) {
  let rx = /([^;=\s]*)=([^;]*)/g;
  let obj = {};
  for (let m; (m = rx.exec(str)); ) obj[m[1]] = decodeURIComponent(m[2]);
  return obj;
}

async function dbConnect() {
  // check if we have a connection to the database or if it's currently
  // connecting or disconnecting (readyState 1, 2 and 3)
  if (mongoose.connection.readyState >= 1) {
    return;
  }

  return mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
  });
}

const apolloServer = new ApolloServer({
  schema,
  context: async ({ req }) => ({
    db: dbConnect(),
    session:
      parseCookies(req.headers.cookie)["next-auth.session-token"] || null,
  }),
  formatError: (err) => {
    // Don't give the specific errors to the client.
    if (err.message.startsWith("Database Error: ")) {
      return new Error("Internal server error");
    }
    // Otherwise return the original error. The error can also
    // be manipulated in other ways, as long as it's returned.
    return err;
  },
});

export const config = {
  api: {
    bodyParser: false,
  },
};

const handler = apolloServer.createHandler({ path: "/api/graphql" });

// This allows CORS between https://obra-website.vercel.app and here.
// The Access-Control-Allow-Origin header should be changed to http://localhost:3000
// on development mode, never forget.
const allowCors = (fn) => async (req, res) => {
  res.setHeader("Access-Control-Allow-Credentials", true);
  res.setHeader(
    "Access-Control-Allow-Origin",
    "https://obra-website.vercel.app"
  );
  // another common pattern
  // res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,OPTIONS,PATCH,DELETE,POST,PUT"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }
  return await fn(req, res);
};

export default allowCors(handler);
