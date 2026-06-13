"use server";

type GraphQLResponse<T> = {
  data: T;
  errors?: {
    message: string;
  }[];
};

export async function fetchGraphQL<TData, TVariables extends object = object>(
  query: string,
  variables?: TVariables,
): Promise<TData> {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_WORDPRESS_URL}/graphql`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query,
        variables,
      }),
      next: {
        revalidate: 60,
      },
    },
  );

  if (!response.ok) {
    throw new Error(`GraphQL request failed: ${response.status}`);
  }

  const { data, errors }: GraphQLResponse<TData> = await response.json();

  if (errors?.length) {
    throw new Error(errors[0].message);
  }

  return data;
}
