import { Injectable, OnDestroy } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { DataService } from './data.service';

@Injectable({
  providedIn: 'root',
})
export class SocketService implements OnDestroy {
  private isConnected$ = new BehaviorSubject<boolean>(false);
  private isPartnerJoined$ = new BehaviorSubject<boolean>(false);
  private orderStatusUpdate$ = new Subject<any>();
  private orderCancelled$ = new Subject<any>();
  private newOrder$ = new Subject<any>();
  private orderAccepted$ = new Subject<any>();
  private orderAssigned$ = new Subject<any>();
  private orderAssignedToDeliveryBoy$ = new Subject<any>();
  private pickupConfirmed$ = new Subject<any>();
  private orderDelivered$ = new Subject<any>();

  constructor(
    private socket: Socket,
    private storage: DataService
  ) {
    this.setupConnectionListeners();
  }

  private setupConnectionListeners() {
    // Listen for connection
    this.socket.on('connect', () => {
      console.log('✅ Socket connected');
      this.isConnected$.next(true);
    });

    // Listen for disconnection
    this.socket.on('disconnect', () => {
      console.log('❌ Socket disconnected');
      this.isConnected$.next(false);
      this.isPartnerJoined$.next(false);
    });

    // Listen for connection errors
    this.socket.on('connect_error', (error: any) => {
      console.error('❌ Socket connection error:', error);
      this.isConnected$.next(false);
    });

    // Listen for partnerJoined confirmation
    this.socket.on('partnerJoined', (data: any) => {
      console.log('✅ Partner joined room:', data);
      this.isPartnerJoined$.next(true);
    });

    // Setup order event listeners
    this.setupOrderEventListeners();
  }

  private setupOrderEventListeners() {
    // Generic order status update
    this.socket.on('orderStatusUpdate', (data: any) => {
      console.log('📦 Order status update received:', data);
      this.orderStatusUpdate$.next(data);
    });

    // Order cancelled
    this.socket.on('orderCancelled', (data: any) => {
      console.log('❌ Order cancelled:', data);
      this.orderCancelled$.next(data);
    });

    // New order placed
    this.socket.on('newOrder', (data: any) => {
      console.log('🆕 New order received:', data);
      this.newOrder$.next(data);
    });

    // Order accepted by partner
    this.socket.on('orderAccepted', (data: any) => {
      console.log('✅ Order accepted:', data);
      this.orderAccepted$.next(data);
    });

    // Order assigned to delivery boy
    this.socket.on('orderAssigned', (data: any) => {
      console.log('🚚 Order assigned:', data);
      this.orderAssigned$.next(data);
    });

    // Order assigned to delivery boy (specific event for partners)
    this.socket.on('orderAssignedToDeliveryBoy', (data: any) => {
      console.log('🚚 Order assigned to delivery boy:', data);
      this.orderAssignedToDeliveryBoy$.next(data);
    });

    // Pickup confirmed
    this.socket.on('pickupConfirmed', (data: any) => {
      console.log('📦 Pickup confirmed:', data);
      this.pickupConfirmed$.next(data);
    });

    // Order delivered
    this.socket.on('orderDelivered', (data: any) => {
      console.log('🎉 Order delivered:', data);
      this.orderDelivered$.next(data);
    });
  }

  /**
   * Join partner room for receiving order updates
   */
  async joinPartnerRoom(partnerId: string, hotelId?: string): Promise<void> {
    if (!partnerId) {
      console.error('❌ Cannot join partner room: partnerId is required');
      return;
    }

    if (this.isPartnerJoined$.value) {
      console.log('ℹ️ Partner already joined room');
      return;
    }

    console.log('👤 Joining partner room:', partnerId, hotelId ? `hotel: ${hotelId}` : '');
    this.socket.emit('partnerJoin', { partnerId, hotelId });
  }

  /**
   * Leave partner room
   */
  leavePartnerRoom(): void {
    if (this.isPartnerJoined$.value) {
      this.socket.emit('disconnect');
      this.isPartnerJoined$.next(false);
    }
  }

  // Observable getters
  get isConnected(): Observable<boolean> {
    return this.isConnected$.asObservable();
  }

  get isPartnerJoined(): Observable<boolean> {
    return this.isPartnerJoined$.asObservable();
  }

  get onOrderStatusUpdate(): Observable<any> {
    return this.orderStatusUpdate$.asObservable();
  }

  get onOrderCancelled(): Observable<any> {
    return this.orderCancelled$.asObservable();
  }

  get onNewOrder(): Observable<any> {
    return this.newOrder$.asObservable();
  }

  get onOrderAccepted(): Observable<any> {
    return this.orderAccepted$.asObservable();
  }

  get onOrderAssigned(): Observable<any> {
    return this.orderAssigned$.asObservable();
  }

  get onOrderAssignedToDeliveryBoy(): Observable<any> {
    return this.orderAssignedToDeliveryBoy$.asObservable();
  }

  get onPickupConfirmed(): Observable<any> {
    return this.pickupConfirmed$.asObservable();
  }

  get onOrderDelivered(): Observable<any> {
    return this.orderDelivered$.asObservable();
  }

  ngOnDestroy() {
    this.leavePartnerRoom();
  }
}

