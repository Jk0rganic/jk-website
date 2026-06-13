import React from "react";
import ResponsiveImage from "./responsiveImage";
import k from "./styles.module.scss";

export interface ImgBoxProps {
  imageSrc: string;
  alt?: string;
  sizes?: string;
  priority?: boolean;
  className?: string;
  srcSet?: string;
}

export default function ImgBox({
  imageSrc = "",
  alt,
  sizes,
  priority,
  className = "",
  srcSet,
}: ImgBoxProps) {
  return (
    <figure className={`${k.picha_pic} ${className}`}>
      <ResponsiveImage
        imageSrc={imageSrc}
        alt={alt}
        sizes={sizes}
        priority={priority}
        srcSet={srcSet}
      />
    </figure>
  );
}
