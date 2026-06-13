export const GET_PRODUCT_BY_SLUG = `
  query GetProductBySlug($slug: ID!) {
    product(id: $slug, idType: SLUG) {
      id
      databaseId
      slug
      name
      __typename
      shortDescription(format: RAW)
      description
      reviewCount
      sku
            productTags {
      nodes {
        slug
        name
      }
    }
      reviews {
      averageRating
        nodes {
          id
          content
          dateGmt
          author {
            name
          }
        }
      }

      productCategories {
        nodes {
          slug
          name
        }
      }

      # Handle both Variable and Simple products
      ... on SimpleProduct {
        price
        regularPrice
        salePrice
        stockStatus
      }

      ... on VariableProduct {
      stockStatus
        variations(first: 10) {
          nodes {
            databaseId
            price
            regularPrice
            salePrice
            attributes {
              nodes {
                name
                value
              }
            }
          }
        }
      }

      image {
        mediaItemUrl
        srcSet
        sizes
        title
      }

      galleryImages {
        nodes {
          id
          mediaItemUrl
          srcSet
          sizes
          title
        }
      }

    related(first: 4) {
      nodes {
        slug
        name
        image {
          mediaItemUrl
          srcSet
          sizes
          title
        }
        ... on SimpleProduct {
          price
          regularPrice
          productCategories {
            nodes {
              name
            }
          }
        }
        ... on VariableProduct {
          productCategories {
            nodes {
              name
            }
          }
          variations(first: 10) {
            nodes {
              databaseId
              price
              regularPrice
              salePrice
              attributes {
                nodes {
                  name
                  value
                }
              }
            }
          }
        }
      }
    }
    }
  }
`;

export const GET_CATEGORIES = `
  query GetCategories($first: Int = 10) {
    productCategories(first: $first) {
      nodes {
        id
        name
        slug
        count
      }
    }
  }
`;

export const GET_PRODUCTS = `
  query GetProducts($first: Int, $after: String, $categorySlug: String   $minPrice: Float $maxPrice: Float) {
    products(first: $first, after: $after, where: { category: $categorySlug minPrice: $minPrice maxPrice: $maxPrice }) {
      nodes {
        slug
        name
        __typename
        ... on VariableProduct {
          productCategories {
            nodes {
              name
            }
          }
          variations(first: 10) {
            nodes {
              databaseId
              price
              regularPrice
              salePrice
              attributes {
                nodes {
                  name
                  value
                }
              }
            }
          }
        }
        ... on SimpleProduct {
          price
          regularPrice
          productCategories {
            nodes {
              name
            }
          }
        }
        image {
          mediaItemUrl
          sizes
          srcSet
          title
        }
      }
      pageInfo {
        endCursor
        hasNextPage
      }
    }
  }
`;

export const GET_PAGE = `
  query GetPage($slug: ID!) {
    page(id: $slug, idType: URI) {
    slug
    title
    content
    }
  }
`;
export const GET_ORDERS = `
  query GetOrders {
    orders {
      edges {
        node {
          id
          databaseId
          status
          total
          date
          billing {
            firstName
            lastName
            email
          }
        }
      }
    }
  }
`;

export const ADD_REVIEW = `
  mutation AddReview(
    $productId: Int!
    $content: String!
    $author: String!
    $authorEmail: String!
  ) {
    createComment(
      input: {
        commentOn: $productId
        content: $content
        author: $author
        authorEmail: $authorEmail
      }
    ) {
      comment {
        id
        content
        author {
          name
          email
        }
      }
    }
  }
`;

//post by slug
export const GET_POST_BY_SLUG = `
  query GetPostBySlug($slug: ID!) {
    post(id: $slug, idType: SLUG) {
      slug
      databaseId
      title
      content(format: RENDERED)
      date

      categories {
        nodes {
          slug
          name
        }
      }

      featuredImage {
        node {
          sourceUrl
        }
      }

      author {
        node {
          name
          avatar {
            url
          }
        }
      }

      comments(first: 50) {
        nodes {
          id
          content
          date
          author {
            node {
              name
              email
              avatar {
                url
              }
            }
          }
        }
      }
    }
  }
`;

export const GET_POSTS = `
  query GetPosts($first: Int, $after: String) {
    posts(first: $first, after: $after) {
      nodes {
        slug
        title
        content(format: RENDERED)
        date
        categories {
          nodes {
            slug
            name
          }
        }
        featuredImage {
          node {
            mediaItemUrl
            srcSet
            sizes
            title
          }
        }
      }
      pageInfo {
        endCursor
        hasNextPage
      }
    }
  }
`;
//related posts
export const GET_RELATED_POSTS = `
  query GetRelatedPosts($categorySlug: String!) {
    posts(where: {categoryName: $categorySlug}) {
      edges {
        node {
          title
          slug
   
        }
      }
    }
  }
`;
