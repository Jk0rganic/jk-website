import { formatPrice } from "@/utils/format-price";

export default function ShippingLines({
  shippingCost,
}: {
  shippingCost: number;
}) {
  return (
    <tr>
      <td>Shipping</td>
      <td>{formatPrice(shippingCost)}</td>
    </tr>
  );
}
