// this is user profile, not merchant's
interface IProfile {
  address: string;
  // country: string;
  countryCode: string;
  countryName: string;
  companyName: string;
  email: string;
  facebook: string;
  firstName: string;
  lastName: string;
  id: number;
  phone: string;
  mobile: string;
  paymentMethod: string;
  linkedIn: string;
  telegram: string;
  tikTok: string;
  vATNumber: string;
  weChat: string;
  whatsAPP: string;
  otherSocialInfo: string;
  token: string;
}

type TMerchantInfo = {
  id: number;
  address: string;
  companyId: string;
  companyLogo: string;
  companyName: string;
  email: string;
  location: string;
  phone: string;
};

type Country = {
  code: string;
  name: string;
};

interface IAddon extends IPlan {
  quantity: number | null;
  checked: boolean;
}

interface IPlan {
  id: number;
  planName: string;
  description: string;
  type: number; // 1: main plan, 2: add-on
  currency: number;
  intervalCount: number;
  intervalUnit: string;
  amount: number;
  status: number; // 1: editing，2: active, 3: inactive，4: expired
  publishStatus: number; // 1: unpublished(not visible to users), 2: published(users could see and choose this plan)
  addons?: IAddon[];
  createTime: number;
  companyId: number;
  merchantId: number;
}

interface ISubAddon extends IPlan {
  // when update subscription plan, I need to know which addons users have selected,
  // then apply them on the plan
  quantity: number;
  addonPlanId: number;
}

interface ISubscriptionType {
  id: number;
  subscriptionId: string;
  planId: number;
  userId: number;
  status: number;
  firstPaidAt: number;
  currentPeriodStart: number;
  currentPeriodEnd: number;
  trialEnd: number; // if it's non-zero (seconds from Epoch): subscription'll end on that date(it should be >= currentPeriodEnd)
  // it's used by admin to extend the next due date.
  cancelAtPeriodEnd: number; // whether this sub will end at the end of billing cycle, 0: false, 1: true
  amount: number;
  currency: string;
  taxScale: number; // 20000 means 20%
  plan: IPlan | undefined; // ?????????? why it can be undefined.
  addons: ISubAddon[];
  user: IProfile | null;
  unfinishedSubscriptionPendingUpdate?: {
    // downgrading will be effective on the next cycle, this props show this pending stat
    effectImmediate: number;
    effectTime: number;
    prorationAmount: number; // for plan upgrading, you need to pay the difference amt.
    paid: number; // 1: paid,
    link: string; // stripe payment link
    plan: IPlan; // original plan
    updatePlan: IPlan; // plan after change(upgrade/downgrade, or quantity change)
    // these are pending subscription's actual data
    updateAmount: number;
    updateCurrency: string;
    updateAddons: ISubAddon[];
    note: string;
  };
}

interface IPreview {
  totalAmount: number;
  currency: string;
  prorationDate: number;
  invoice: Invoice;
  nextPeriodInvoice: Invoice;
}

type InvoiceItem = {
  id?: string; // when creating new invoice, list needs an id for each row, but backend response has no id.
  amount: number | string; // when admin creating an invoice, inputbox value is string.
  amountExcludingTax: number | string;
  currency: string;
  description: string;
  periodEnd?: number;
  periodStart?: number;
  proration?: boolean;
  quantity: number | string;
  tax: number | string; // tax amount
  taxScale: number | string; // tax rate
  unitAmountExcludingTax: number | string;
};

// when admin update user subscription, this Invoice is part of the response
type Invoice = {
  currency: string;
  subscriptionAmount: number;
  subscriptionAmountExcludingTax: number;
  taxAmount: number;
  totalAmount: number;
  totalAmountExcludingTax: number;
  lines: InvoiceItem[];
};

// this is for user view only, generated by admin or system automatically
interface UserInvoice {
  id: number;
  merchantId: number;
  userId: number;
  subscriptionId: string;
  invoiceId: string;
  invoiceName: string;
  gatewayInvoiceId: string;
  uniqueId: string;
  createTime: number;
  totalAmount: number;
  taxAmount: number;
  taxScale: number;
  subscriptionAmount: number;
  currency: string;
  lines: InvoiceItem[];
  gatewayId: number;
  status: number; // go check INVOICE_STATUS in constants.ts
  sendStatus: number;
  sendEmail: string;
  sendPdf: string;
  data: string;
  isDeleted: number;
  link: string;
  gatewayStatus: string;
  gatewayPaymentId: string;
  gatewayUserId: string;
  gatewayInvoicePdf: string;
  taxPercentage: number;
  sendNote: string;
  sendTerms: string;
  totalAmountExcludingTax: number;
  subscriptionAmountExcludingTax: number;
  periodStart: number;
  periodEnd: number;
  paymentId: string;
  refundId: string;
}

type TInvoicePerm = {
  editable: boolean; // in list view, can I click the record, and open a Modal to edit it
  savable: boolean; // in Modal, can I click save (save a newly created invoice, not yet publish)
  creatable: boolean; // in Modal, can I click create, to create an invoice.
  publishable: boolean; // in Modal, can I click 'publish', after publish, user can see it and receive a mail with payment link
  revokable: boolean; // the opposite of publish, if user hasn't paid the invoice within *** days, admin can revoke it. But if user has paid, admin cannot revoke it.
  deletable: boolean; // in list view, can I click the delete icon, only manually created invoice, and before publish
  refundable: boolean; // in list view, can I cilck the refund icon
  downloadable: boolean; // download invoice, true: for all system-generated invoice, and amdin manually generated(only after publish)
  sendable: boolean; // send invoice via email, ditto
};

export type {
  IProfile,
  TMerchantInfo,
  IPlan,
  ISubscriptionType,
  Country,
  IPreview,
  UserInvoice,
  InvoiceItem,
  TInvoicePerm,
};
