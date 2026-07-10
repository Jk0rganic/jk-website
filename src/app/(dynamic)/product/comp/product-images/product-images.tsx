import Image from "next/image";
import { useState } from "react";
import ImgBox from "@/comp/imgbox/ImgBox";
import styles from "./styles.module.scss";

interface ProductImage {
  id: string;
  mediaItemUrl: string;
  title?: string;
  sizes?: string;
  srcSet?: string;
}

interface Props {
  image?: ProductImage;
  galleryImages?: ProductImage[];
}

export default function ProductImages({ image, galleryImages = [] }: Props) {
  const [mainImage, setMainImage] = useState<ProductImage | null>(
    image ?? galleryImages[0] ?? null,
  );

  if (!mainImage) return null;

  const { mediaItemUrl, title, sizes, srcSet } = mainImage;

  return (
    <div className={styles.product_images}>
      <ImgBox
        className={styles.big_img}
        imageSrc={mediaItemUrl}
        srcSet={srcSet}
        sizes={sizes}
        alt={title || "Product Image"}
      />
      <div className={styles.gallery_images}>
        {galleryImages.map((img) => (
          <div
            key={img.id}
            className={`${styles.thumb_wrapper} ${img.mediaItemUrl === mediaItemUrl ? styles.selected : ""}`}
            onClick={() => setMainImage(img)}
          >
            <Image
              src={img.mediaItemUrl}
              alt={img.title ?? ""}
              width={50}
              height={50}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
