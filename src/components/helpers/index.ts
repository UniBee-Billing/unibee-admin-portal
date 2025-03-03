import { UserInvoice } from '../../shared.types'
import { useAppConfigStore } from '../../stores'

export const normalizeAmt = (iv: UserInvoice[]) => {
  const CURRENCIES = useAppConfigStore.getState().supportCurrency
  iv.forEach((v) => {
    const currency = CURRENCIES.find((cur) => cur.Currency == v.currency)
    if (currency == undefined) {
      return
    }
    const f = currency.Scale
    v.subscriptionAmount /= f
    v.subscriptionAmountExcludingTax /= f
    v.taxAmount /= f
    v.totalAmount /= f
    v.totalAmountExcludingTax /= f
    if (v.discountAmount != null) {
      v.discountAmount /= f
    }
    if (v.originAmount != null) {
      v.originAmount /= f
    }

    v.lines?.forEach((l) => {
      ;(l.amount as number) /= f
      ;(l.amountExcludingTax as number) /= f
      ;(l.tax as number) /= f
      ;(l.unitAmountExcludingTax as number) /= f
      if (l.originAmount != null) {
        l.originAmount /= f
      }
      if (l.discountAmount != null) {
        l.discountAmount /= f
      }
    })

    if (v.refund != null) {
      // is it possible that payment is in Dollar, but refund is in Euro??
      v.refund.refundAmount /= f
    }
  })
}
