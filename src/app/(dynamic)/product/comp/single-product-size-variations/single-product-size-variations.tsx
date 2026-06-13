import k from "./styles.module.scss";

interface Props {
  variation?: { nodes?: ProductVariation[] };
  selected?: number;
  handleSelect: (v: ProductVariation) => void;
}

const getSizeLabel = (v: ProductVariation) =>
  v.attributes?.nodes?.find((a) => a.name?.toLowerCase() === "size")?.value ??
  "N/A";

export default function SingleProductSizeVariations({
  variation,
  selected,
  handleSelect,
}: Props) {
  return (
    <div className={k.size}>
      <div className={k.options}>
        {variation?.nodes?.map((v) => (
          <button
            type="button"
            key={v.databaseId}
            onClick={() => handleSelect(v)}
            className={`${k.option} ${selected === v.databaseId ? k.active : ""}`}
          >
            <span>{getSizeLabel(v)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
