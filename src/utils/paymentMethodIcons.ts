/**
 * Payment Method Icon Mapping
 * 
 * Since Stripe doesn't provide a direct API to get payment method icons,
 * we maintain a manual mapping of payment types to their icon URLs.
 * 
 * All icons are stored locally to avoid network dependencies.
 * 
 * Reference:
 * - Stripe Payment Method Types: https://stripe.com/docs/payments/payment-methods
 * - Common payment method codes: card, alipay, wechat_pay, ideal, bancontact, etc.
 */

// Import local payment icons
import visaIcon from '@/assets/paymentIcons/visa-svgrepo-com.svg'
import mastercardIcon from '@/assets/paymentIcons/mastercard-svgrepo-com.svg'
import amexIcon from '@/assets/paymentIcons/amex-svgrepo-com.svg'
import paypalIcon from '@/assets/paymentIcons/paypal-svgrepo-com.svg'
import btcIcon from '@/assets/paymentIcons/btc-svgrepo-com.svg'
import ethIcon from '@/assets/paymentIcons/eth-svgrepo-com.svg'
import litecoinIcon from '@/assets/paymentIcons/litecoin.svg'
import usdtIcon from '@/assets/paymentIcons/usdt-svgrepo-com.svg'
import wireTransferIcon from '@/assets/paymentIcons/wire-transfer.svg'
import alipayIcon from '@/assets/paymentIcons/alipay.svg'
import wechatIcon from '@/assets/paymentIcons/wechat.svg'
import applepayIcon from '@/assets/paymentIcons/applepay.svg'
import googlepayIcon from '@/assets/paymentIcons/googlepay.svg'
import idealIcon from '@/assets/paymentIcons/ideal.svg'
import bancontactIcon from '@/assets/paymentIcons/bancontact.svg'
import giropayIcon from '@/assets/paymentIcons/giropay.svg'
import klarnaIcon from '@/assets/paymentIcons/klarna.svg'
import sofortIcon from '@/assets/paymentIcons/sofort.svg'
import cashappIcon from '@/assets/paymentIcons/cashapp.svg'
import p24Icon from '@/assets/paymentIcons/p24.svg'
import sepaIcon from '@/assets/paymentIcons/sepa.svg'
import epsIcon from '@/assets/paymentIcons/eps.svg'
import samsungPayIcon from '@/assets/paymentIcons/samsung-pay.svg'
import grabPayIcon from '@/assets/paymentIcons/grabpay.svg'
import mbWayIcon from '@/assets/paymentIcons/mbway.svg'
import paycoIcon from '@/assets/paymentIcons/payco.svg'
import krCardIcon from '@/assets/paymentIcons/krcard.svg'
import naverPayIcon from '@/assets/paymentIcons/naverpay.svg'
import paynowIcon from '@/assets/paymentIcons/paynow.svg'
import jkopayIcon from '@/assets/paymentIcons/jkopay.svg'
import pagoIcon from '@/assets/paymentIcons/mercado-pago.svg'
import pagaleveIcon from '@/assets/paymentIcons/pagaleve.svg'
import pixIcon from '@/assets/paymentIcons/pix.svg'
/**
 * Payment method type to icon mapping
 * Key: payment method type (usually in lowercase)
 * Value: imported local SVG icon
 */
export const PAYMENT_METHOD_ICONS: Record<string, string> = {
  // Card payments
  'card': visaIcon, // Default to visa for generic card
  'visa': visaIcon,
  'mastercard': mastercardIcon,
  'amex': amexIcon,
  'american_express': amexIcon,
  
  // Digital wallets
  'paypal': paypalIcon,
  'alipay': alipayIcon,
  'wechat': wechatIcon,
  'wechat_pay': wechatIcon,
  'apple_pay': applepayIcon,
  'google_pay': googlepayIcon,
  'samsung_pay': samsungPayIcon,
  'grabpay': grabPayIcon,
  'mb_way': mbWayIcon,
  'payco': paycoIcon,
  'kr_card': krCardIcon,
  'naver_pay': naverPayIcon,
  'paynow': paynowIcon,
  
  // Bank transfers
  'ideal': idealIcon,
  'bancontact': bancontactIcon,
  'sepa_debit': sepaIcon,
  'sepa': sepaIcon,
  'bank_transfer': wireTransferIcon,
  'wire_transfer': wireTransferIcon,
  'ach_debit': wireTransferIcon,
  
  // Crypto
  'bitcoin': btcIcon,
  'btc': btcIcon,
  'ethereum': ethIcon,
  'eth': ethIcon,
  'litecoin': litecoinIcon,
  'ltc': litecoinIcon,
  'usdt': usdtIcon,
  'tether': usdtIcon,
  
  // Other payment methods
  'giropay': giropayIcon,
  'klarna': klarnaIcon,
  'sofort': sofortIcon,
  'eps': epsIcon,
  'p24': p24Icon,
  'przelewy24': p24Icon,
  'jkopay': jkopayIcon,
  'mercadopago_br': pagoIcon,
  'mercadopago_cl': pagoIcon,
  'pagaleve': pagaleveIcon,
  'pix': pixIcon,
}

/**
 * Get icon URL for a payment method type
 * @param paymentType - The payment method type (e.g., 'card', 'alipay', 'wechat_pay')
 * @returns Icon URL or undefined if not found
 */
export const getPaymentMethodIcon = (paymentType: string): string | undefined => {
  if (!paymentType) return undefined
  
  // Try exact match first
  const exactMatch = PAYMENT_METHOD_ICONS[paymentType.toLowerCase()]
  if (exactMatch) return exactMatch
  
  // Try partial matches for compound payment types
  const lowerType = paymentType.toLowerCase()
  
  // Check if it contains card-related keywords
  if (lowerType.includes('visa')) return visaIcon
  if (lowerType.includes('mastercard') || lowerType.includes('master')) return mastercardIcon
  if (lowerType.includes('amex') || lowerType.includes('american')) return amexIcon
  if (lowerType.includes('card')) return visaIcon
  
  // Check if it contains crypto keywords
  if (lowerType.includes('btc') || lowerType.includes('bitcoin')) return btcIcon
  if (lowerType.includes('eth') || lowerType.includes('ethereum')) return ethIcon
  if (lowerType.includes('ltc') || lowerType.includes('litecoin')) return litecoinIcon
  if (lowerType.includes('usdt') || lowerType.includes('tether')) return usdtIcon
  
  // Check if it contains wallet keywords
  if (lowerType.includes('alipay')) return alipayIcon
  if (lowerType.includes('wechat')) return wechatIcon
  if (lowerType.includes('paypal')) return paypalIcon
  
  // Check if it contains bank/wire keywords
  if (lowerType.includes('bank') || lowerType.includes('wire') || lowerType.includes('sepa') || lowerType.includes('ach')) {
    return wireTransferIcon
  }
  
  return undefined
}

/**
 * Get multiple icons for compound payment types
 * Some payment types might represent multiple methods (e.g., "card" could show visa, mastercard, amex)
 * @param paymentType - The payment method type
 * @returns Array of icon URLs
 */
export const getPaymentMethodIcons = (paymentType: string): string[] => {
  if (!paymentType) return []
  
  const lowerType = paymentType.toLowerCase()
  
  // Generic "card" type should show multiple card brands
  if (lowerType === 'card' || lowerType === 'credit_card' || lowerType === 'debit_card') {
    return [visaIcon, mastercardIcon, amexIcon]
  }
  
  // Otherwise, return single icon or empty array
  const icon = getPaymentMethodIcon(paymentType)
  return icon ? [icon] : []
}

