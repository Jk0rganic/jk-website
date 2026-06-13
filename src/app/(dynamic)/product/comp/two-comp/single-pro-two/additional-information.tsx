import k from "./styles.module.scss";

export default function AdditionalInformation({
  product,
}: {
  product: Product | null;
}) {
  const variations = product?.variations?.nodes || [];
  if (variations.length === 0) {
    return <p>No additional information available.</p>;
  }

  return (
    <div className={k.additional_information}>
      <h4>Additional Information</h4>

      <div className={k.wrapper}>
        <small>Size</small>
        <ul>
          {variations.map((variation) => (
            <li key={variation.id}>
              {variation.attributes?.nodes
                ?.map((attr) => attr.value)
                .join(", ")}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
