import k from "./styles.module.scss";

export default function ProductTags({
  productTags,
}: {
  productTags: { name: string; slug: string }[];
}) {
  if (!productTags || productTags.length === 0) return null;

  return (
    <div className={k.tags}>
      {productTags.map((tag) => (
        <span key={tag.slug} className={k.tag}>
          {tag.name}
        </span>
      ))}
    </div>
  );
}
