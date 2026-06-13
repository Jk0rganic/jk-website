import k from "./styles.module.scss";

export default function PostSkeleton({ count = 4, ...rest }) {
  const skeletons = Array.from({ length: count }, (_, index) => (
    <div
      key={index}
      className={k.card}
      aria-live="polite"
      aria-busy="true"
      aria-label={`Loading post ${index + 1}`}
    >
      <div className={k.img} style={{ ...rest }} />
      <div className={k.content}>
        <div className={k.category} />
        <div className={k.title} />
      </div>
    </div>
  ));

  return <>{skeletons}</>; // No wrapper div
}
