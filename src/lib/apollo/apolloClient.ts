import { ApolloClient, HttpLink, InMemoryCache } from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import { getWordpressConfig } from "../fetch/baseUrl";

const { BASE_URL } = getWordpressConfig();

// ✅ HTTP connection to your WP GraphQL endpoint
const httpLink = new HttpLink({
  uri: `${BASE_URL}/graphql`,
});

// ✅ Add authorization header (for protected queries/mutations)
const authLink = setContext((_, { headers }) => {
  const token = process.env.NEXT_PUBLIC_WORDPRESS_JWT;

  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : "",
    },
  };
});

// ✅ Create Apollo Client instance
export const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
  defaultOptions: {
    query: {
      fetchPolicy: "no-cache", // avoid stale data for SSR
    },
  },
});
