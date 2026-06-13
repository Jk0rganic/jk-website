export function getOrderRedirectPath(
  orderId: number | string,
  isLoggedIn: boolean,
): string {
  return isLoggedIn ? `/account/orders/${orderId}` : `/order/${orderId}`;
}
