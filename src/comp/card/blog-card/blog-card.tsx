import Link from "next/link";
import { formatDate } from "@/utils/formatDate";
import Article from "../../article/Article";
import ImgBox from "../../imgbox/ImgBox";
import k from "./styles.module.scss";

export default function BlogCard({ blog }: { blog: Blog }) {
  const imageUrl =
    blog?.featuredImage?.node?.mediaItemUrl ||
    "https://res.cloudinary.com/dj200tags/image/upload/v1768508608/divin-mbea-yC3vG_aWeSY-unsplash_11zon.webp";
  const srcset = blog?.featuredImage?.node?.srcSet;
  const sizes = blog?.featuredImage?.node?.sizes;
  const altText = blog?.featuredImage?.node?.title;
  const shortParagraph = blog.content ? blog.content.slice(0, 200) : "";

  const formattedDate = formatDate(blog?.date);

  return (
    <Link href={`/blog/${blog.slug}`} className={k.card}>
      <ImgBox
        className={k.img_box}
        imageSrc={imageUrl}
        srcSet={srcset}
        sizes={sizes}
        alt={altText}
      />
      <Article className={k.content}>
        <div className={k.category}>
          <span>{formattedDate}</span>
          <span>{blog.categories?.nodes?.[0]?.name}</span>
        </div>
        <h3>{blog.title}</h3>
        <div
          className={k.p}
          dangerouslySetInnerHTML={{ __html: shortParagraph }}
        />
      </Article>
    </Link>
  );
}
