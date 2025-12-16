/**
 * Order Status Constants
 * 
 * This file contains all order status definitions, flow information, and helper functions
 * for managing order statuses throughout the application.
 * 
 * Based on: Restaurant-API/src/models/order.model.js
 * Status enum: [0, 1, 2, 3, 4, 5, 6, 7, 8]
 */

/**
 * Order Status Enum
 * Maps status codes to their numeric values
 */
export enum OrderStatus {
  RECEIVED = 0,
  BEING_PREPARED = 1,
  DELIVERY_ASSIGNED = 2,
  DELIVERED = 3,
  ACCEPTED = 4,
  CANCELLED_BY_HOTEL = 5,
  PICKUP_CONFIRMED = 6,
  CANCELLED_BY_CUSTOMER = 7,
  REJECTED_BY_DELIVERY_BOY = 8,
}



/**
 * Order Status Metadata Interface
 */
export interface OrderStatusMetadata {
  code: OrderStatus;
  name: string;
  description: string;
  timeline: string;
  nextValidStatuses: OrderStatus[];
  isFinal: boolean;
  color: string; // For UI display
  icon?: string; // Optional icon name
  canPartnerAction: boolean; // Whether partner can perform actions
  canCustomerAction: boolean; // Whether customer can perform actions
  canDeliveryBoyAction: boolean; // Whether delivery boy can perform actions
}

/**
 * Complete Order Status Metadata
 * Contains all status information including flow and permissions
 */
export const ORDER_STATUS_METADATA: Record<OrderStatus, OrderStatusMetadata> = {
  [OrderStatus.RECEIVED]: {
    code: OrderStatus.RECEIVED,
    name: 'Received',
    description: 'Order placed by customer, received by restaurant',
    timeline: 'Order Placed',
    nextValidStatuses: [OrderStatus.ACCEPTED, OrderStatus.BEING_PREPARED, OrderStatus.CANCELLED_BY_HOTEL, OrderStatus.CANCELLED_BY_CUSTOMER],
    isFinal: false,
    color: 'warning',
    icon: 'time-outline',
    canPartnerAction: true, // Partner can accept or reject
    canCustomerAction: true, // Customer can cancel
    canDeliveryBoyAction: false,
  },
  [OrderStatus.BEING_PREPARED]: {
    code: OrderStatus.BEING_PREPARED,
    name: 'Being Prepared',
    description: 'Restaurant is preparing the order',
    timeline: 'Order being prepared',
    nextValidStatuses: [OrderStatus.DELIVERY_ASSIGNED, OrderStatus.CANCELLED_BY_HOTEL],
    isFinal: false,
    color: 'primary',
    icon: 'restaurant-outline',
    canPartnerAction: true, // Partner is preparing
    canCustomerAction: false,
    canDeliveryBoyAction: false,
  },
  [OrderStatus.DELIVERY_ASSIGNED]: {
    code: OrderStatus.DELIVERY_ASSIGNED,
    name: 'Delivery Assigned',
    description: 'Delivery boy assigned to pick up and deliver order',
    timeline: 'Delivery assigned',
    nextValidStatuses: [OrderStatus.DELIVERED, OrderStatus.PICKUP_CONFIRMED, OrderStatus.REJECTED_BY_DELIVERY_BOY],
    isFinal: false,
    color: 'tertiary',
    icon: 'bicycle-outline',
    canPartnerAction: false,
    canCustomerAction: false,
    canDeliveryBoyAction: true, // Delivery boy can confirm pickup or reject
  },
  [OrderStatus.DELIVERED]: {
    code: OrderStatus.DELIVERED,
    name: 'Delivered',
    description: 'Order successfully delivered to customer',
    timeline: 'Order delivered',
    nextValidStatuses: [],
    isFinal: true,
    color: 'success',
    icon: 'checkmark-circle-outline',
    canPartnerAction: false,
    canCustomerAction: false,
    canDeliveryBoyAction: false,
  },
  [OrderStatus.ACCEPTED]: {
    code: OrderStatus.ACCEPTED,
    name: 'Accepted',
    description: 'Restaurant accepted the order',
    timeline: 'Order Accepted',
    nextValidStatuses: [OrderStatus.BEING_PREPARED, OrderStatus.CANCELLED_BY_HOTEL],
    isFinal: false,
    color: 'success',
    icon: 'checkmark-outline',
    canPartnerAction: true, // Partner can start preparation or cancel
    canCustomerAction: false,
    canDeliveryBoyAction: false,
  },
  [OrderStatus.CANCELLED_BY_HOTEL]: {
    code: OrderStatus.CANCELLED_BY_HOTEL,
    name: 'Cancelled by Hotel',
    description: 'Restaurant rejected/cancelled the order',
    timeline: 'Order Rejected',
    nextValidStatuses: [],
    isFinal: true,
    color: 'danger',
    icon: 'close-circle-outline',
    canPartnerAction: false,
    canCustomerAction: false,
    canDeliveryBoyAction: false,
  },
  [OrderStatus.PICKUP_CONFIRMED]: {
    code: OrderStatus.PICKUP_CONFIRMED,
    name: 'Pickup Confirmed',
    description: 'Delivery boy confirmed pickup from restaurant',
    timeline: 'Confirm Pickup',
    nextValidStatuses: [OrderStatus.DELIVERED, OrderStatus.REJECTED_BY_DELIVERY_BOY],
    isFinal: false,
    color: 'secondary',
    icon: 'bag-check-outline',
    canPartnerAction: false,
    canCustomerAction: false,
    canDeliveryBoyAction: true, // Delivery boy can deliver or reject
  },
  [OrderStatus.CANCELLED_BY_CUSTOMER]: {
    code: OrderStatus.CANCELLED_BY_CUSTOMER,
    name: 'Cancelled by Customer',
    description: 'Customer cancelled the order',
    timeline: 'Order Cancelled',
    nextValidStatuses: [],
    isFinal: true,
    color: 'warning',
    icon: 'close-outline',
    canPartnerAction: false,
    canCustomerAction: false,
    canDeliveryBoyAction: false,
  },
  [OrderStatus.REJECTED_BY_DELIVERY_BOY]: {
    code: OrderStatus.REJECTED_BY_DELIVERY_BOY,
    name: 'Rejected by Delivery Boy',
    description: 'Delivery boy rejected the assigned order',
    timeline: 'Order rejected by delivery boy',
    nextValidStatuses: [OrderStatus.DELIVERY_ASSIGNED], // Can be re-assigned
    isFinal: false,
    color: 'danger',
    icon: 'close-circle-outline',
    canPartnerAction: false,
    canCustomerAction: false,
    canDeliveryBoyAction: false, // Admin needs to re-assign
  },
};

/**
 * Order Status Flow - Typical progression
 */
export const ORDER_STATUS_FLOW: OrderStatus[] = [
  OrderStatus.RECEIVED,           // 0: Customer places order
  OrderStatus.ACCEPTED,            // 4: Restaurant accepts
  OrderStatus.BEING_PREPARED,     // 1: Restaurant starts preparing
  OrderStatus.DELIVERY_ASSIGNED,  // 2: Admin assigns delivery boy
  OrderStatus.PICKUP_CONFIRMED,   // 6: Delivery boy picks up
  OrderStatus.DELIVERED,          // 3: Order delivered (FINAL)
];

/**
 * Final Statuses - Orders that cannot transition to other statuses
 */
export const FINAL_STATUSES: OrderStatus[] = [
  OrderStatus.DELIVERED,
  OrderStatus.CANCELLED_BY_HOTEL,
  OrderStatus.CANCELLED_BY_CUSTOMER,
];

/**
 * Cancelled Statuses - All cancellation statuses
 */
export const CANCELLED_STATUSES: OrderStatus[] = [
  OrderStatus.CANCELLED_BY_HOTEL,
  OrderStatus.CANCELLED_BY_CUSTOMER,
];

/**
 * Active Statuses - Orders that are still in progress
 */
export const ACTIVE_STATUSES: OrderStatus[] = [
  OrderStatus.RECEIVED,
  OrderStatus.ACCEPTED,
  OrderStatus.BEING_PREPARED,
  OrderStatus.DELIVERY_ASSIGNED,
  OrderStatus.PICKUP_CONFIRMED,
];

/**
 * Partner Actionable Statuses - Statuses where partner can perform actions
 */
export const PARTNER_ACTIONABLE_STATUSES: OrderStatus[] = [
  OrderStatus.RECEIVED,      // Can accept or reject
  OrderStatus.ACCEPTED,      // Can start preparation
  OrderStatus.BEING_PREPARED, // Currently preparing
];

/**
 * Helper Functions
 */

/**
 * Get status metadata by status code
 * @param status - Order status code
 * @returns OrderStatusMetadata or undefined if not found
 */
export function getStatusMetadata(status: number | OrderStatus): OrderStatusMetadata | undefined {
  return ORDER_STATUS_METADATA[status as OrderStatus];
}

/**
 * Get status name by status code
 * @param status - Order status code
 * @returns Status name or 'Unknown'
 */
export function getStatusName(status: number | OrderStatus): string {
  const metadata = getStatusMetadata(status);
  return metadata?.name || 'Unknown';
}

/**
 * Get status description by status code
 * @param status - Order status code
 * @returns Status description or empty string
 */
export function getStatusDescription(status: number | OrderStatus): string {
  const metadata = getStatusMetadata(status);
  return metadata?.description || '';
}

/**
 * Get status color for UI display
 * @param status - Order status code
 * @returns Color name for Ionic components
 */
export function getStatusColor(status: number | OrderStatus): string {
  const metadata = getStatusMetadata(status);
  return metadata?.color || 'medium';
}

/**
 * Get status icon name
 * @param status - Order status code
 * @returns Icon name or undefined
 */
export function getStatusIcon(status: number | OrderStatus): string | undefined {
  const metadata = getStatusMetadata(status);
  return metadata?.icon;
}

/**
 * Get timeline text for status
 * @param status - Order status code
 * @returns Timeline text
 */
export function getStatusTimeline(status: number | OrderStatus): string {
  const metadata = getStatusMetadata(status);
  return metadata?.timeline || '';
}

/**
 * Check if status is final (cannot transition)
 * @param status - Order status code
 * @returns true if status is final
 */
export function isFinalStatus(status: number | OrderStatus): boolean {
  const metadata = getStatusMetadata(status);
  return metadata?.isFinal || false;
}

/**
 * Check if status is cancelled
 * @param status - Order status code
 * @returns true if status is cancelled
 */
export function isCancelledStatus(status: number | OrderStatus): boolean {
  return CANCELLED_STATUSES.includes(status as OrderStatus);
}

/**
 * Check if status is active (in progress)
 * @param status - Order status code
 * @returns true if status is active
 */
export function isActiveStatus(status: number | OrderStatus): boolean {
  return ACTIVE_STATUSES.includes(status as OrderStatus);
}

/**
 * Check if partner can perform actions on this status
 * @param status - Order status code
 * @returns true if partner can act
 */
export function canPartnerAction(status: number | OrderStatus): boolean {
  const metadata = getStatusMetadata(status);
  return metadata?.canPartnerAction || false;
}

/**
 * Check if customer can perform actions on this status
 * @param status - Order status code
 * @returns true if customer can act
 */
export function canCustomerAction(status: number | OrderStatus): boolean {
  const metadata = getStatusMetadata(status);
  return metadata?.canCustomerAction || false;
}

/**
 * Check if delivery boy can perform actions on this status
 * @param status - Order status code
 * @returns true if delivery boy can act
 */
export function canDeliveryBoyAction(status: number | OrderStatus): boolean {
  const metadata = getStatusMetadata(status);
  return metadata?.canDeliveryBoyAction || false;
}

/**
 * Get next valid statuses for a given status
 * @param status - Current order status code
 * @returns Array of valid next status codes
 */
export function getNextValidStatuses(status: number | OrderStatus): OrderStatus[] {
  const metadata = getStatusMetadata(status);
  return metadata?.nextValidStatuses || [];
}

/**
 * Check if a status transition is valid
 * @param fromStatus - Current status
 * @param toStatus - Target status
 * @returns true if transition is valid
 */
export function isValidStatusTransition(
  fromStatus: number | OrderStatus,
  toStatus: number | OrderStatus
): boolean {
  const nextStatuses = getNextValidStatuses(fromStatus);
  return nextStatuses.includes(toStatus as OrderStatus);
}

/**
 * Get all statuses as an array
 * @returns Array of all order status codes
 */
export function getAllStatuses(): OrderStatus[] {
  return Object.values(OrderStatus).filter(
    (value) => typeof value === 'number'
  ) as OrderStatus[];
}

/**
 * Get statuses for partner app (filtered by actionable statuses)
 * @returns Array of status codes relevant to partner
 */
export function getPartnerStatuses(): OrderStatus[] {
  return [
    OrderStatus.RECEIVED,
    OrderStatus.ACCEPTED,
    OrderStatus.BEING_PREPARED,
    OrderStatus.DELIVERY_ASSIGNED,
    OrderStatus.PICKUP_CONFIRMED,
    OrderStatus.DELIVERED,
    OrderStatus.CANCELLED_BY_HOTEL,
    OrderStatus.CANCELLED_BY_CUSTOMER,
  ];
}

/**
 * Status Display Labels for UI
 */
export const STATUS_DISPLAY_LABELS: Record<OrderStatus, string> = {
  [OrderStatus.RECEIVED]: 'Received',
  [OrderStatus.BEING_PREPARED]: 'Preparing',
  [OrderStatus.DELIVERY_ASSIGNED]: 'Assigned',
  [OrderStatus.DELIVERED]: 'Delivered',
  [OrderStatus.ACCEPTED]: 'Accepted',
  [OrderStatus.CANCELLED_BY_HOTEL]: 'Cancelled',
  [OrderStatus.PICKUP_CONFIRMED]: 'Picked Up',
  [OrderStatus.CANCELLED_BY_CUSTOMER]: 'Cancelled',
  [OrderStatus.REJECTED_BY_DELIVERY_BOY]: 'Rejected',
};

/**
 * Status Short Labels for compact UI
 */
export const STATUS_SHORT_LABELS: Record<OrderStatus, string> = {
  [OrderStatus.RECEIVED]: 'New',
  [OrderStatus.BEING_PREPARED]: 'Prep',
  [OrderStatus.DELIVERY_ASSIGNED]: 'Assigned',
  [OrderStatus.DELIVERED]: 'Done',
  [OrderStatus.ACCEPTED]: 'Accepted',
  [OrderStatus.CANCELLED_BY_HOTEL]: 'Cancelled',
  [OrderStatus.PICKUP_CONFIRMED]: 'Picked',
  [OrderStatus.CANCELLED_BY_CUSTOMER]: 'Cancelled',
  [OrderStatus.REJECTED_BY_DELIVERY_BOY]: 'Rejected',
};

