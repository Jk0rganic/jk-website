const customerMap = new Map();
let lastCustomerNumber = 0;

export function generateCustomerId(userId: string) {
  if (!userId) return null;

  if (customerMap.has(userId)) {
    return customerMap.get(userId);
  }

  lastCustomerNumber += 1;
  customerMap.set(userId, lastCustomerNumber);
  return lastCustomerNumber;
}
