import { useQuery } from "@apollo/client/react";

export function useApolloFetcher(query: any, variables = {}) {
  return useQuery(query, { variables });
}
