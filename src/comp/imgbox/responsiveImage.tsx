import Image, { type ImageProps } from "next/image";

interface ResponsiveImageProps
  extends Omit<ImageProps, "src" | "alt" | "fill"> {
  imageSrc: string;
  alt?: string;
  sizes?: string;
  priority?: boolean;
  imgClassName?: string;
  srcSet?: string;
}

export default function ResponsiveImage({
  imageSrc,
  alt = "",
  sizes = "(max-width: 768px) 100vw, 50vw",
  priority = false,
  imgClassName,
  srcSet: _srcSet,
  ...props
}: ResponsiveImageProps) {
  if (!imageSrc) return null;

  return (
    <Image
      src={imageSrc}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      className={imgClassName}
      {...props}
    />
  );
}
