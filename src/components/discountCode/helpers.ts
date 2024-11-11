// When quantity is 0, it means the quantity is unlimited.
const UNLIMITED_QUANTITY = 0

export const formatQuantity = (quantity: number) =>
  quantity === UNLIMITED_QUANTITY ? 'Unlimited' : quantity
