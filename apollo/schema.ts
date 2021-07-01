import { makeExecutableSchema } from "graphql-tools";
import { typeDefs } from "./typeDefs";
import { resolvers } from "./resolvers";

import { createRateLimitDirective } from 'graphql-rate-limit';

// Step 1: get rate limit directive instance
const rateLimitDirective = createRateLimitDirective({ identifyContext: (ctx) => ctx.session });

export const schema = makeExecutableSchema({
  schemaDirectives: {
    rateLimit: rateLimitDirective
  },
  typeDefs,
  resolvers,
});
