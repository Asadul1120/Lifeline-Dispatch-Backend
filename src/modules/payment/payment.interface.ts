export interface ICreatePayment {
  requestId: string;
  amount: number;
}

export interface IPaymentCallback {
  paymentID: string;
  status: string;
  merchantInvoiceNumber?: string;
}
