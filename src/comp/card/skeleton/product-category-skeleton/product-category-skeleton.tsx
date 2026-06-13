import k from "./styles.module.scss";

export default function ProductCategorySkeleton() {
  return (
    <div className={k.skeleton_category} aria-live="polite" aria-busy="true">
      <div className={k.title} />
    </div>
  );
}
