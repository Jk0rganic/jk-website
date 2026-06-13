export interface GetPostBySlugVariables {
  slug: string;
}

interface PostCategory {
  slug: string;
  name: string;
}

interface PostAuthor {
  node: {
    name: string;
    avatar?: {
      url: string;
    };
  };
}

interface PostComment {
  id: string;
  content: string;
  date: string;
  authorName: string;

  author: {
    node: {
      name: string;
      email: string;

      avatar?: {
        url: string;
      };
    };
  };
}

export interface PostTypes {
  slug: string;
  databaseId: number;

  title: string;
  content: string;
  date: string;

  categories: {
    nodes: PostCategory[];
  };

  featuredImage?: {
    node: {
      sourceUrl: string;
      mediaItemUrl: string;
      srcSet?: string;
      sizes?: string;
      title?: string;
    };
  };

  author: PostAuthor;

  comments: {
    nodes: PostComment[];
  };
}
