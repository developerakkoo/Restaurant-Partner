import { Component, OnInit, OnDestroy } from '@angular/core';
import {
  ActionSheetController,
  LoadingController,
  ToastController,
} from '@ionic/angular';
import { AuthService } from '../services/auth.service';
import { SocketService } from '../services/socket.service';
import { DataService } from '../services/data.service';
import { HttpErrorResponse } from '@angular/common/http';
import { Subscription } from 'rxjs';
import {
  OrderStatus,
  getStatusName,
  getStatusColor,
  getStatusIcon,
  getStatusMetadata,
  isValidStatusTransition,
  canPartnerAction,
  PARTNER_ACTIONABLE_STATUSES,
  isCancelledStatus,
} from '../constants/order-status.constants';

@Component({
  selector: 'app-tab4',
  templateUrl: './tab4.page.html',
  styleUrls: ['./tab4.page.scss'],
})
export class Tab4Page implements OnInit, OnDestroy {
  statuses: OrderStatus[] = [OrderStatus.RECEIVED]; // Default to Received
  allOrders: any[] = []; // Store all orders
  orders: any[] = []; // Filtered orders to display
  currentSegmentValue: string = '0'; // Track current segment
  isLoading: boolean = false;
  isRefreshing: boolean = false;
  partnerId: string = '';
  hotelId: string = '';

  // Socket subscriptions
  private socketSubscriptions: Subscription[] = [];

  // Expose OrderStatus enum to template
  OrderStatus = OrderStatus;

  constructor(
    private loadingController: LoadingController,
    private toastController: ToastController,
    private auth: AuthService,
    private actionSheetController: ActionSheetController,
    private socketService: SocketService,
    private dataService: DataService
  ) {}

  async ngOnInit() {
    // Get partner and hotel IDs from auth service
    this.partnerId = this.auth.userId.value || '';
    this.hotelId = this.auth.shopId.value || '';
    
    // If not available, try to get from storage
    if (!this.partnerId) {
      const storedUserId = await this.dataService.get('userId');
      this.partnerId = storedUserId || '';
    }
    if (!this.hotelId) {
      const storedHotelId = await this.dataService.get('hotelId');
      this.hotelId = storedHotelId || '';
    }
    
    console.log('Partner ID:', this.partnerId, 'Hotel ID:', this.hotelId);
    
    // Join partner room for Socket.IO updates
    if (this.partnerId) {
      await this.socketService.joinPartnerRoom(this.partnerId, this.hotelId);
    }
    
    // Setup socket listeners
    this.setupSocketListeners();
  }

  ngOnDestroy() {
    // Unsubscribe from all socket events
    this.socketSubscriptions.forEach((sub) => sub.unsubscribe());
  }

  /**
   * Setup Socket.IO event listeners for real-time order updates
   */
  private setupSocketListeners(): void {
    console.log('🔌 Setting up socket listeners for partner orders');

    // Listen for new orders
    const newOrderSub = this.socketService.onNewOrder.subscribe((data: any) => {
      console.log('🆕 [Socket] New order received:', data);
      const order = data.order || data;
      if (this.isOrderForThisPartner(order)) {
        this.handleNewOrder(order);
      }
    });

    // Listen for order status updates
    const statusUpdateSub = this.socketService.onOrderStatusUpdate.subscribe(
      (data: any) => {
        console.log('📦 [Socket] Order status update:', data);
        const order = data.order || data;
        if (this.isOrderForThisPartner(order)) {
          this.handleOrderUpdate(order);
        }
      }
    );

    // Listen for order accepted
    const acceptedSub = this.socketService.onOrderAccepted.subscribe(
      (data: any) => {
        console.log('✅ [Socket] Order accepted:', data);
        const order = data.order || data;
        if (this.isOrderForThisPartner(order)) {
          this.handleOrderUpdate(order);
        }
      }
    );

    // Listen for order assigned to delivery boy
    const assignedSub = this.socketService.onOrderAssigned.subscribe(
      (data: any) => {
        console.log('🚚 [Socket] Order assigned:', data);
        const order = data.order || data;
        if (this.isOrderForThisPartner(order)) {
          this.handleOrderUpdate(order);
        }
      }
    );

    // Listen for order assigned to delivery boy (specific event for partners)
    const assignedToDeliveryBoySub = this.socketService.onOrderAssignedToDeliveryBoy.subscribe(
      (data: any) => {
        console.log('🚚 [Socket] Order assigned to delivery boy:', data);
        const order = data.order || data;
        if (this.isOrderForThisPartner(order)) {
          this.handleOrderUpdate(order);
          // Show notification
          this.presentToast(`Order ${order.orderId} assigned to delivery boy`, 'primary');
        }
      }
    );

    // Listen for pickup confirmed
    const pickupSub = this.socketService.onPickupConfirmed.subscribe(
      (data: any) => {
        console.log('📦 [Socket] Pickup confirmed:', data);
        const order = data.order || data;
        if (this.isOrderForThisPartner(order)) {
          this.handleOrderUpdate(order);
        }
      }
    );

    // Listen for order delivered
    const deliveredSub = this.socketService.onOrderDelivered.subscribe(
      (data: any) => {
        console.log('🎉 [Socket] Order delivered:', data);
        const order = data.order || data;
        if (this.isOrderForThisPartner(order)) {
          this.handleOrderUpdate(order);
        }
      }
    );

    // Listen for order cancelled
    const cancelledSub = this.socketService.onOrderCancelled.subscribe(
      (data: any) => {
        console.log('❌ [Socket] Order cancelled:', data);
        const order = data.order || data;
        if (this.isOrderForThisPartner(order)) {
          this.handleOrderUpdate(order);
        }
      }
    );

    // Store all subscriptions
    this.socketSubscriptions.push(
      newOrderSub,
      statusUpdateSub,
      acceptedSub,
      assignedSub,
      assignedToDeliveryBoySub,
      pickupSub,
      deliveredSub,
      cancelledSub
    );
  }

  /**
   * Check if order belongs to this partner's hotel
   */
  private isOrderForThisPartner(order: any): boolean {
    if (!order) return false;
    
    // Check if order's hotelId matches this partner's hotel
    const orderHotelId = order.hotelId?._id || order.hotelId;
    if (orderHotelId && this.hotelId) {
      return orderHotelId.toString() === this.hotelId.toString();
    }
    
    // If hotelId not available, check userId (partner ID)
    const orderUserId = order.userId?._id || order.userId;
    if (orderUserId && this.partnerId) {
      return orderUserId.toString() === this.partnerId.toString();
    }
    
    return false;
  }

  /**
   * Handle new order received via Socket.IO
   */
  private async handleNewOrder(order: any): Promise<void> {
    // Add to allOrders if not already present
    const existingIndex = this.allOrders.findIndex(
      (o) => o._id === order._id || o.orderId === order.orderId
    );

    if (existingIndex === -1) {
      this.allOrders.unshift(order); // Add to beginning
      console.log('✅ New order added to list');
    } else {
      this.allOrders[existingIndex] = order; // Update existing
      console.log('✅ Existing order updated');
    }

    // Re-filter orders
    this.filterOrders();

    // Show notification
    await this.presentToast(`New order received: ${order.orderId}`, 'primary');
  }

  /**
   * Handle order update received via Socket.IO
   */
  private handleOrderUpdate(order: any): void {
    // Update order in allOrders
    const existingIndex = this.allOrders.findIndex(
      (o) => o._id === order._id || o.orderId === order.orderId
    );

    if (existingIndex !== -1) {
      this.allOrders[existingIndex] = { ...this.allOrders[existingIndex], ...order };
      console.log('✅ Order updated in list');
    } else {
      // Order not in list, add it
      this.allOrders.push(order);
      console.log('✅ New order added to list');
    }

    // Re-filter orders
    this.filterOrders();
  }

  ionViewDidEnter() {
    this.getAllOrders();
    
    // Rejoin socket room if needed
    if (this.partnerId) {
      this.socketService.joinPartnerRoom(this.partnerId, this.hotelId);
    }
    
    // Fallback: Refresh orders if socket events haven't been received within 10 seconds
    setTimeout(() => {
      if (this.allOrders.length === 0) {
        console.log('⚠️ No orders received via socket, refreshing from API...');
        this.getAllOrders();
      }
    }, 10000);
  }

  segmentChanged(ev: any) {
    console.log('Segment changed to:', ev.detail.value);
    const segmentValue = ev.detail.value;
    this.currentSegmentValue = segmentValue;
    
    // Map segment values to order statuses
    switch (segmentValue) {
      case '0':
        this.statuses = [OrderStatus.RECEIVED]; // Received orders
        break;
      case '4':
        // Arriving orders include delivery assigned (2), accepted (4) and pickup confirmed (6)
        this.statuses = [
          OrderStatus.DELIVERY_ASSIGNED,
          OrderStatus.ACCEPTED,
          OrderStatus.PICKUP_CONFIRMED,
        ];
        break;
      case '3':
        this.statuses = [OrderStatus.DELIVERED]; // Completed orders
        break;
      default:
        this.statuses = [OrderStatus.RECEIVED];
    }
    
    this.filterOrders();
  }

  /**
   * Get segment title for display
   */
  getSegmentTitle(): string {
    switch (this.currentSegmentValue) {
      case '0':
        return 'New Orders';
      case '4':
        return 'Arriving Orders';
      case '3':
        return 'Completed Orders';
      default:
        return 'Orders';
    }
  }

  /**
   * Check if order is new (received in last 5 minutes)
   */
  isNewOrder(item: any): boolean {
    if (!item.createdAt) return false;
    const orderDate = new Date(item.createdAt);
    const now = new Date();
    const diffMinutes = (now.getTime() - orderDate.getTime()) / (1000 * 60);
    return diffMinutes <= 5;
  }

  /**
   * Track by function for ngFor performance
   */
  trackByOrderId(index: number, item: any): string {
    return item._id || item.orderId || index;
  }

  async handleRefresh(event?: any) {
    if (this.isRefreshing) {
      if (event?.target?.complete) {
        event.target.complete();
      }
      return;
    }

    this.isRefreshing = true;
    console.log('Refreshing orders data...');

    try {
      await this.getAllOrders(false);
    } catch (error) {
      console.error('Error refreshing orders:', error);
    } finally {
      this.isRefreshing = false;
      if (event?.target?.complete) {
        event.target.complete();
      }
    }
  }

  // Filter orders based on current segment
  filterOrders() {
    console.log('Filtering orders for statuses:', this.statuses);

    // Handle both 'status' and 'orderStatus' field names
    // Ensure proper type comparison (convert to numbers for consistency)
    this.orders = this.allOrders.filter((order) => {
      const orderStatus = order.orderStatus;
      const orderStatusNum = typeof orderStatus === 'string' ? parseInt(orderStatus, 10) : orderStatus;
      
      // Check if order status is in the statuses array
      const isIncluded = this.statuses.some(status => {
        const statusNum = typeof status === 'string' ? parseInt(status, 10) : status;
        return statusNum === orderStatusNum;
      });
      
      return isIncluded;
    });

    console.log('Filtered orders count:', this.orders.length, 'out of', this.allOrders.length);
  }

  /**
   * Check if partner can accept this order
   */
  canAcceptOrder(item: any): boolean {
    const status = item.orderStatus ?? item.status ?? 0;
    return status === OrderStatus.RECEIVED && canPartnerAction(status);
  }

  /**
   * Check if partner can reject this order
   */
  canRejectOrder(item: any): boolean {
    const status = item.orderStatus ?? item.status ?? 0;
    return status === OrderStatus.RECEIVED && canPartnerAction(status);
  }

  /**
   * Check if partner can start preparation
   */
  canStartPreparation(item: any): boolean {
    const status = item.orderStatus ?? item.status ?? 0;
    return status === OrderStatus.ACCEPTED && canPartnerAction(status);
  }

  /**
   * Accept order
   */
  async acceptOrder(orderId: string): Promise<void> {
    const loading = await this.loadingController.create({
      message: 'Accepting order...',
      spinner: 'crescent',
    });
    await loading.present();

    this.auth.AcceptRejectOrder(orderId, OrderStatus.ACCEPTED).subscribe({
      next: async (value: any) => {
        await loading.dismiss();
        console.log('Order accepted:', value);
        await this.presentToast('Order accepted successfully', 'success');
        this.getAllOrders(); // Refresh all orders and re-filter
      },
      error: async (error: HttpErrorResponse) => {
        await loading.dismiss();
        console.error('Error accepting order:', error);
        await this.presentToast(
          error.error?.message || 'Failed to accept order',
          'danger'
        );
      },
    });
  }

  /**
   * Reject order
   */
  async rejectOrder(orderId: string): Promise<void> {
    const alert = await this.actionSheetController.create({
      header: 'Reject Order',
      subHeader: 'Are you sure you want to reject this order?',
      buttons: [
        {
          text: 'Reject',
          role: 'destructive',
          icon: 'trash',
          handler: async () => {
            const loading = await this.loadingController.create({
              message: 'Rejecting order...',
              spinner: 'crescent',
            });
            await loading.present();

            this.auth
              .AcceptRejectOrder(orderId, OrderStatus.CANCELLED_BY_HOTEL)
              .subscribe({
                next: async (value: any) => {
                  await loading.dismiss();
                  console.log('Order rejected:', value);
                  await this.presentToast('Order rejected', 'warning');
                  this.getAllOrders(); // Refresh all orders and re-filter
                },
                error: async (error: HttpErrorResponse) => {
                  await loading.dismiss();
                  console.error('Error rejecting order:', error);
                  await this.presentToast(
                    error.error?.message || 'Failed to reject order',
                    'danger'
                  );
                },
              });
          },
        },
        {
          text: 'Cancel',
          role: 'cancel',
          icon: 'close',
        },
      ],
    });

    await alert.present();
  }

  /**
   * Start preparation
   */
  async startPreparation(orderId: string): Promise<void> {
    const loading = await this.loadingController.create({
      message: 'Starting preparation...',
      spinner: 'crescent',
    });
    await loading.present();

    this.auth.updateOrderStatus(orderId, OrderStatus.BEING_PREPARED).subscribe({
      next: async (value: any) => {
        await loading.dismiss();
        console.log('Preparation started:', value);
        await this.presentToast('Preparation started', 'success');
        this.getAllOrders(); // Refresh all orders and re-filter
      },
      error: async (error: HttpErrorResponse) => {
        await loading.dismiss();
        console.error('Error starting preparation:', error);
        await this.presentToast(
          error.error?.message || 'Failed to start preparation',
          'danger'
        );
      },
    });
  }

  async presentActionSheet(orderId: any, currentStatus?: number) {
    const status =
      currentStatus !== undefined
        ? currentStatus
        : this.allOrders.find((o) => o._id === orderId)?.orderStatus ??
          this.allOrders.find((o) => o._id === orderId)?.status ??
          this.statuses[0] ?? OrderStatus.RECEIVED;

    if (status === OrderStatus.RECEIVED) {
      const actionSheet = await this.actionSheetController.create({
        header: 'Order Actions',
        buttons: [
          {
            text: 'Accept',
            role: '',
            icon: 'checkmark',
            handler: () => {
              this.acceptOrder(orderId);
            },
          },
          {
            text: 'Reject',
            icon: 'trash',
            handler: () => {
              this.rejectOrder(orderId);
            },
          },
          {
            text: 'Cancel',
            icon: 'close',
            role: 'cancel',
          },
        ],
      });

      await actionSheet.present();
    } else if (status === OrderStatus.ACCEPTED) {
      const actionSheet = await this.actionSheetController.create({
        header: 'Order Actions',
        buttons: [
          {
            text: 'Start Preparation',
            role: '',
            icon: 'play',
            handler: () => {
              this.startPreparation(orderId);
            },
          },
          {
            text: 'Cancel',
            icon: 'close',
            role: 'cancel',
          },
        ],
      });

      await actionSheet.present();
    }
  }

  // Fetch all orders without status filter
  async getAllOrders(showLoader: boolean = true): Promise<void> {
    if (showLoader) {
      this.isLoading = true;
    }

    return new Promise<void>((resolve) => {
      this.auth.getAllOrders().subscribe({
        next: async (value: any) => {
          console.log('All orders received:', value);
          // Handle different response structures
          if (value?.data) {
            // Check if data is an array or has a content property
            if (Array.isArray(value.data)) {
              this.allOrders = value.data;
            } else if (value.data.content && Array.isArray(value.data.content)) {
              this.allOrders = value.data.content;
            } else if (value.data.orders && Array.isArray(value.data.orders)) {
              this.allOrders = value.data.orders;
            } else {
              this.allOrders = [];
            }
          } else if (Array.isArray(value)) {
            this.allOrders = value;
          } else {
            this.allOrders = [];
          }
          console.log('Processed orders:', this.allOrders);
          this.filterOrders(); // Apply current filter
          if (showLoader) {
            this.isLoading = false;
          }
          resolve();
        },
        error: async (error: HttpErrorResponse) => {
          console.error('Error fetching orders:', error);
          console.error('Error details:', error.error);
          this.allOrders = [];
          this.filterOrders();
          if (showLoader) {
            this.isLoading = false;
          }
          resolve();
        },
      });
    });
  }

  /**
   * Get status name for display (using constants)
   */
  getStatusNameForDisplay(status: number): string {
    return getStatusName(status);
  }

  /**
   * Get status color for badge (using constants)
   */
  getStatusColorForDisplay(status: number): string {
    return getStatusColor(status);
  }

  /**
   * Get status icon for display (using constants)
   */
  getStatusIconForDisplay(status: number): string {
    return getStatusIcon(status) || 'time-outline';
  }

  /**
   * Present toast notification
   */
  private async presentToast(
    message: string,
    color: 'success' | 'danger' | 'warning' | 'primary' = 'primary'
  ): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      color,
      position: 'top',
    });
    await toast.present();
  }

  /**
   * Calculate total amount partner will get based on partner price per product
   */
  getPartnerTotalAmount(item: any): number {
    const products = item.products || item.items || [];
    if (Array.isArray(products) && products.length > 0) {
      const total = products.reduce((sum: number, product: any) => {
        const price =
          product.dishId?.partnerPrice ??
          0;
        const quantity = product.quantity ?? 1;
        return sum + price * quantity;
      }, 0);
      if (!isNaN(total) && total > 0) {
        return total;
      }
    }
    // Fallback to priceDetails partnerPrice if no products array or zero sum
    return (
      item.priceDetails?.partnerPrice ??
      item.priceDetails?.subtotal ??
      item.priceDetails?.totalAmountToPay ??
      0
    );
  }
}
