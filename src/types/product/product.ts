export interface GetProductBySlugVariables {
  slug: string;
}

interface ProductTag {
  slug: string;
  name: string;
}

export interface ProductCategory {
  count: number;
  slug: string;
  name: string;
}

interface ProductAttribute {
  name: string;
  value: string;
}

export interface ProductVariation {
  id: string;
  databaseId: number;
  price: string;
  regularPrice: string;
  salePrice?: string;

  attributes: {
    nodes: ProductAttribute[];
  };
}

interface ProductImage {
  id: string;
  sourceUrl: string;
  mediaItemUrl: string;
  srcSet?: string;
  sizes?: string;
  title?: string;
}

interface ProductReview {
  id: string;
  content: string;
  dateGmt: string;
  averageRating: string;

  author: {
    name: string;
  };
}

export interface ProductTypes {
  id: string;
  databaseId: number;

  slug: string;
  name: string;

  __typename: "SimpleProduct" | "VariableProduct";

  shortDescription: string;
  description: string;

  reviewCount: number;
  sku: string;

  price?: string;
  regularPrice?: string;
  salePrice?: string;

  stockStatus?: "IN_STOCK" | "OUT_OF_STOCK";
  rating: number;
  productTags: {
    nodes: ProductTag[];
  };

  reviews: {
    averageRating: number;
    nodes: ProductReview[];
  };

  productCategories: {
    nodes: ProductCategory[];
  };

  variations?: {
    nodes: ProductVariation[];
  };

  image?: ProductImage;

  galleryImages?: {
    nodes: (ProductImage & {
      id: string;
    })[];
  };

  related: {
    nodes: ProductTypes[];
  };
}
