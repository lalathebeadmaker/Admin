import { OrderStatus, Currency, MetaEntry, LineItem } from "./types";


  
  function getMetaValue(meta: MetaEntry[], key: string): string | undefined {
    const entry = meta.find(m => m.key === key);
    return entry?.value;
  }

  function resolveProductId(item: LineItem): string {
    const internalId = getMetaValue(item.meta_data ?? [], "_internal_product_id");
    return internalId ?? String(item.product_id);
  }

function mapWooStatus(status: string): OrderStatus {
  const statusLower = status.toLowerCase();
  
  switch (statusLower) {
    case 'pending':
      return OrderStatus.PENDING;
    case 'processing':
      return OrderStatus.PROCESSING;
    case 'completed':
      return OrderStatus.COMPLETED;
    case 'cancelled':
      return OrderStatus.CANCELLED;
    case 'shipped':
      return OrderStatus.SHIPPED;
    case 'delivered':
      return OrderStatus.DELIVERED;
    case 'on-hold':
    case 'accepted':
    default:
      return OrderStatus.ACCEPTED;
  }
}

function mapCurrency(code: string): Currency {
  const currencyCode = code.toUpperCase();
  
  switch (currencyCode) {
    case 'NGN':
      return Currency.NGN;
    case 'USD':
      return Currency.USD;
    case 'GBP':
      return Currency.GBP;
    case 'EUR':
      return Currency.EUR;
    case 'CAD':
      return Currency.CAD;
    default:
      return Currency.USD;
  }
}

function estimateDelivery(): Date {
  const d = new Date();
  d.setDate(d.getDate() + 14);
  return d;
}

export const WooMapper = {
  getMetaValue,
  resolveProductId,
  mapWooStatus,
  mapCurrency,
  estimateDelivery,
};
