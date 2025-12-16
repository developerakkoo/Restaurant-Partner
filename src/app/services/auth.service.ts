import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { DataService } from './data.service';
import { environment } from 'src/environments/environment';
import {
  PartnerRegisterRequest,
  PartnerRegisterResponse,
  PartnerLoginRequest,
  PartnerLoginResponse,
  UserData,
  HotelData,
} from '../models/auth.models';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  // BehaviorSubjects for reactive state management
  userAuthState: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  accessToken: BehaviorSubject<string> = new BehaviorSubject<string>('');
  userId: BehaviorSubject<string> = new BehaviorSubject<string>('');
  shopId: BehaviorSubject<string> = new BehaviorSubject<string>('');
  shopData: BehaviorSubject<HotelData | null> = new BehaviorSubject<HotelData | null>(null);
  userData: BehaviorSubject<UserData | null> = new BehaviorSubject<UserData | null>(null);
  hotelCount: BehaviorSubject<number> = new BehaviorSubject<number>(0);

  constructor(private http: HttpClient, private storage: DataService) {
    this.init();
  }

  /**
   * Initialize auth state from storage
   */
  async init(): Promise<void> {
    try {
      const token = await this.storage.get('accessToken');
      const userId = await this.storage.get('userId');
      const shopId = await this.storage.get('hotelId');
      const hotelCount = await this.storage.get('hotelCount');
      const userDataStr = await this.storage.get('userData');
      const hotelDataStr = await this.storage.get('hotelData');

      if (token) {
        this.accessToken.next(token);
      }
      if (userId) {
        this.userId.next(userId);
      }
      if (shopId) {
        this.shopId.next(shopId);
      }
      if (hotelCount) {
        this.hotelCount.next(parseInt(hotelCount, 10) || 0);
      }
      if (userDataStr) {
        try {
          this.userData.next(JSON.parse(userDataStr));
        } catch (e) {
          console.error('Error parsing userData:', e);
        }
      }
      if (hotelDataStr) {
        try {
          this.shopData.next(JSON.parse(hotelDataStr));
        } catch (e) {
          console.error('Error parsing hotelData:', e);
        }
      }

      // Set auth state based on token presence
      this.userAuthState.next(!!token);
    } catch (error) {
      console.error('Error initializing auth service:', error);
    }
  }

  /**
   * Register a new partner
   * POST /api/v1/auth/partner/register
   */
  register(body: PartnerRegisterRequest): Observable<PartnerRegisterResponse> {
    const url = `${environment.URL}auth/partner/register`;
    return this.http.post<PartnerRegisterResponse>(url, body).pipe(
      catchError((error) => {
        console.error('Registration error:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Login partner
   * POST /api/v1/auth/partner/login
   */
  login(body: PartnerLoginRequest): Observable<PartnerLoginResponse> {
    const url = `${environment.URL}auth/partner/login`;
    return this.http.post<PartnerLoginResponse>(url, body).pipe(
      tap(async (response) => {
        if (response?.data) {
          await this.handleLoginSuccess(response.data);
        }
      }),
      catchError((error) => {
        console.error('Login error:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Handle successful login - store data and update state
   */
  private async handleLoginSuccess(data: PartnerLoginResponse['data']): Promise<void> {
    try {
      // Extract userId - handle both object and string cases
      const userId = typeof data.userId === 'string' ? data.userId : data.userId._id;
      
      // Extract hotelId - handle both object and string cases
      let hotelId: string | null = null;
      if (data.hotelId) {
        hotelId = typeof data.hotelId === 'string' ? data.hotelId : data.hotelId._id;
      }
      
      const hotelCount = data.hotelCount || 0;

      // Store tokens
      await this.storage.set('accessToken', data.accessToken);
      await this.storage.set('refreshToken', data.refreshToken);

      // Store user data
      await this.storage.set('userId', userId);
      await this.storage.set('userData', JSON.stringify(data.userId));
      await this.storage.set('hotelCount', hotelCount.toString());

      // Store hotel data if exists
      if (data.hotelId && data.hotelId !== null && hotelId) {
        await this.storage.set('hotelId', hotelId);
        await this.storage.set('hotelData', JSON.stringify(data.hotelId));
      } else {
        // Clear hotel data if null
        await this.storage.remove('hotelId');
        await this.storage.remove('hotelData');
      }

      // Update BehaviorSubjects
      this.accessToken.next(data.accessToken);
      this.userId.next(userId);
      this.userData.next(data.userId);
      this.hotelCount.next(hotelCount);

      if (hotelId) {
        this.shopId.next(hotelId);
        // Only set shopData if hotelId is an object (HotelData)
        if (typeof data.hotelId !== 'string' && data.hotelId !== null) {
          this.shopData.next(data.hotelId as HotelData);
        }
      } else {
        this.shopId.next('');
        this.shopData.next(null);
      }

      this.userAuthState.next(true);
    } catch (error) {
      console.error('Error handling login success:', error);
      throw error;
    }
  }

  /**
   * Logout partner
   * POST /api/v1/partner/logout
   */
  async logout(): Promise<void> {
    try {
      const token = this.accessToken.value;
      if (token) {
        const url = `${environment.URL}partner/logout`;
        const headers = new HttpHeaders({
          'x-access-token': token,
        });

        // Call logout endpoint
        this.http.post(url, {}, { headers }).subscribe({
          next: () => console.log('Logout successful'),
          error: (err) => console.error('Logout error:', err),
        });
      }

      // Clear local storage
      await this.clearAuthData();
    } catch (error) {
      console.error('Error during logout:', error);
      // Clear local data even if API call fails
      await this.clearAuthData();
    }
  }

  /**
   * Clear all authentication data
   */
  private async clearAuthData(): Promise<void> {
    await this.storage.remove('accessToken');
    await this.storage.remove('refreshToken');
    await this.storage.remove('userId');
    await this.storage.remove('userData');
    await this.storage.remove('hotelId');
    await this.storage.remove('hotelData');
    await this.storage.remove('hotelCount');

    // Reset BehaviorSubjects
    this.accessToken.next('');
    this.userId.next('');
    this.shopId.next('');
    this.userData.next(null);
    this.shopData.next(null);
    this.hotelCount.next(0);
    this.userAuthState.next(false);
  }

  /**
   * Get authentication headers
   */
  getAuthHeaders(): HttpHeaders {
    const token = this.accessToken.value;
    return new HttpHeaders({
      'x-access-token': token || '',
      'Content-Type': 'application/json',
    });
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.accessToken.value && this.userAuthState.value;
  }

  /**
   * Refresh access token
   * POST /api/v1/auth/get-access-token
   */
  refreshToken(): Observable<any> {
    return new Observable((observer) => {
      this.storage.get('refreshToken').then((refreshToken) => {
        if (!refreshToken) {
          observer.error(new Error('Refresh token not found'));
          return;
        }

        const url = `${environment.URL}auth/get-access-token`;
        this.http.post(url, { refreshToken }).pipe(
          tap(async (response: any) => {
            if (response?.data?.accessToken) {
              await this.storage.set('accessToken', response.data.accessToken);
              this.accessToken.next(response.data.accessToken);
            }
          }),
          catchError((error) => {
            console.error('Token refresh error:', error);
            // If refresh fails, logout user
            this.logout();
            return throwError(() => error);
          })
        ).subscribe({
          next: (value) => observer.next(value),
          error: (err) => observer.error(err),
          complete: () => observer.complete(),
        });
      }).catch((error) => {
        observer.error(error);
      });
    });
  }

  /**
   * Get partner by ID
   * GET /api/v1/partner/get/byId/:partnerId
   */
  getPartnerById(populate?: boolean): Observable<any> {
    const userId = this.userId.value;
    if (!userId) {
      return throwError(() => new Error('User ID not found'));
    }

    let url = `${environment.URL}partner/get/byId/${userId}`;
    if (populate) {
      url += '?populate=1';
    }

    return this.http.get(url, {
      headers: this.getAuthHeaders(),
    });
  }

  /**
   * Update partner profile
   * PUT /api/v1/partner/update/:partnerId
   */
  updatePartnerById(body: { name?: string; email?: string; phoneNumber?: string }): Observable<any> {
    const userId = this.userId.value;
    if (!userId) {
      return throwError(() => new Error('User ID not found'));
    }

    const url = `${environment.URL}partner/update/${userId}`;
    return this.http.put(url, body, {
      headers: this.getAuthHeaders(),
    });
  }
  /**
   * Register a hotel
   * POST /api/v1/partner/hotel/register
   */
  hotelRegister(name: string, address: string, category: string[], lat?: number, lng?: number): Observable<any> {
    const userId = this.userId.value;
    if (!userId) {
      return throwError(() => new Error('User ID not found. Please login first.'));
    }

    const url = `${environment.URL}partner/hotel/register`;
    const body: any = {
      hotelName: name,
      userId: userId,
      address: address,
      category: category,
    };

    // Add optional location coordinates if provided
    if (lat !== undefined && lng !== undefined) {
      body.lat = lat;
      body.lng = lng;
    }

    return this.http.post(url, body, {
      headers: this.getAuthHeaders(),
    });
  }

  /**
   * Update hotel details
   * PUT /api/v1/partner/hotel/update
   */
  updateHotel(body: {
    hotelId: string;
    hotelName?: string;
    address?: string;
    hotelStatus?: number;
    category?: string[];
    isOnline?: boolean;
  }): Observable<any> {
    const url = `${environment.URL}partner/hotel/update`;
    return this.http.put(url, body, {
      headers: this.getAuthHeaders(),
    });
  }

  /**
   * Upload hotel image
   * POST /api/v1/partner/hotel/upload/image
   */
  uploadHotelImage(formdata: FormData): Observable<any> {
    const url = `${environment.URL}partner/hotel/upload/image`;
    const headers = new HttpHeaders({
      'x-access-token': this.accessToken.value || '',
    });
    
    return this.http.post(url, formdata, { headers });
  }

  uploadImage(formdata: any) {
    console.log('data in upload image http function');
    console.log(formdata);

    return this.http.post(
      environment.URL + `partner/document/upload`,
      formdata
    );
  }
  uploadServiceImage(formdata: any) {
    return this.http.post(
      environment.URL + `partner/service/upload-image`,
      formdata,
      {
        headers: {
          'x-access-token': this.accessToken.value,
        },
      }
    );
  }
  setLaundryLiveStatus(isOpen: number, laundryId: any) {
    return this.http.put(
      environment.URL + `partner/shop/update/${laundryId}`,
      {
        isOpen: isOpen,
      },
      {
        headers: {
          'x-access-token': this.accessToken.value,
        },
      }
    );
  }

  /**
   * Update shop/hotel online status
   * PUT /api/v1/partner/hotel/update
   */
  updateShopStatus(isOpen: boolean): Observable<any> {
    const hotelId = this.shopId.value;
    if (!hotelId) {
      return throwError(() => new Error('Hotel ID not found'));
    }

    const url = `${environment.URL}partner/hotel/update`;
    const body = {
      hotelId: hotelId,
      isOnline: isOpen,
    };

    return this.http.put(url, body, {
      headers: this.getAuthHeaders(),
    });
  }

  // Get shop data to check current status
  /**
   * Get shop/hotel data
   * Note: This endpoint may not exist. Use getPartnerById with populate instead.
   */
  getShopData() {
    const hotelId = this.shopId.value;
    if (!hotelId) {
      return throwError(() => new Error('Hotel ID not found'));
    }

    // Try to get hotel by ID from hotel API
    const url = `${environment.URL}hotel/get/byId/${hotelId}`;
    return this.http.get(url, {
      headers: this.getAuthHeaders(),
    });
  }

  /**
   * Get partner dashboard statistics
   * GET /api/v1/partner/get/dashboard/:partnerId
   */
  getPartnerDashboard() {
    const userId = this.userId.value;
    if (!userId) {
      return throwError(() => new Error('User ID not found. Please login first.'));
    }

    const url = `${environment.URL}partner/get/dashboard/${userId}`;
    return this.http.get(url, {
      headers: this.getAuthHeaders(),
    });
  }

  /**
   * Get partner earnings
   * GET /api/v1/partner/get/earnings/:partnerId
   */
  getPartnerEarnings(startDate?: string, endDate?: string): Observable<any> {
    const userId = this.userId.value;
    if (!userId) {
      return throwError(() => new Error('User ID not found'));
    }

    let url = `${environment.URL}partner/get/earnings/${userId}`;
    const params: string[] = [];
    if (startDate) params.push(`startDate=${startDate}`);
    if (endDate) params.push(`endDate=${endDate}`);
    if (params.length > 0) {
      url += '?' + params.join('&');
    }

    return this.http.get(url, {
      headers: this.getAuthHeaders(),
    });
  }

  markCategoryStockStatus(isOutOfStock: number, categoryId: string) {
    return this.http.put(
      environment.URL +
        `partner/category/${categoryId}/toggleStoke/${this.shopId.value}`,
      {
        isOutOfStock: isOutOfStock,
      },
      {
        headers: {
          'x-access-token': this.accessToken.value,
        },
      }
    );
  }

  addService(body: any) {
    return this.http.post(environment.URL + `partner/service/add`, body, {
      headers: {
        'x-access-token': this.accessToken.value,
      },
    });
  }

  editService(body: any, id: any) {
    return this.http.post(
      environment.URL + `partner/service/update/${id}`,
      body,
      {
        headers: {
          'x-access-token': this.accessToken.value,
        },
      }
    );
  }
  /**
   * Get all orders for partner
   * GET /api/v1/partner/get/orders
   */
  getAllOrders(status?: number): Observable<any> {
    const url = `${environment.URL}partner/get/orders`;
    return this.http.get(url, {
      headers: this.getAuthHeaders(),
    });
  }

  /**
   * Get orders by status for a hotel
   * GET /api/v1/partner/get/orders-by-status/:hotelId
   */
  getOrdersByStatus(hotelId: string, status?: number): Observable<any> {
    const url = `${environment.URL}partner/get/orders-by-status/${hotelId}`;
    return this.http.get(url, {
      headers: this.getAuthHeaders(),
    });
  }
  /**
   * Get all categories
   * GET /api/v1/admin/category/get/all
   */
  getAllCategory(): Observable<any> {
    const url = `${environment.URL}admin/category/get/all`;
    return this.http.get(url, {
      headers: this.getAuthHeaders(),
    });
  }

  /**
   * Update order status
   * PUT /api/v1/order/update/order-status
   */
  updateOrderStatus(orderId: any, status: any): Observable<any> {
    const url = `${environment.URL}order/update/order-status`;
    return this.http.put(
      url,
      {
        orderId,
        status,
      },
      {
        headers: this.getAuthHeaders(),
      }
    );
  }

  /**
   * Accept or reject order
   * PUT /api/v1/order/accept-reject
   */
  AcceptRejectOrder(orderId: any, status: any): Observable<any> {
    const url = `${environment.URL}order/accept-reject`;
    return this.http.put(
      url,
      {
        orderId,
        status,
      },
      {
        headers: this.getAuthHeaders(),
      }
    );
  }

  getAllLaundryServices() {
    return this.http.get(
      environment.URL + `partner/service/get/shopId/${this.shopId.value}`,
      {
        headers: {
          'x-access-token': this.accessToken.value.toString(),
        },
      }
    );
  }

  getServiceById(serviceId: any) {
    return this.http.get(environment.URL + `partner/service/get/${serviceId}`, {
      headers: {
        'x-access-token': this.accessToken.value.toString(),
      },
    });
  }

  deleteServiceById(serviceId: any) {
    return this.http.delete(
      environment.URL + `partner/service/delete/${serviceId}`,
      {
        headers: {
          'x-access-token': this.accessToken.value.toString(),
        },
      }
    );
  }
  getAllHotelsPartner() {
    return this.http.get(
      environment.URL + `partner/get/hotels/${this.userId.value.toString()}`,
      {
        headers: {
          'x-access-token': this.accessToken.value.toString(),
        },
      }
    );
  }

  getAllNotificationsPartner() {
    return this.http.get(
      environment.URL +
        `notification/get/all/user/${this.userId.value.toString()}`,
      {
        headers: {
          'x-access-token': this.accessToken.value.toString(),
        },
      }
    );
  }

  /**
   * Dish Management Methods
   * Based on API documentation
   */

  /**
   * Add hotel dish
   * POST /api/v1/partner/hotel/add-dish
   */
  addDish(body: {
    hotelId: string;
    name: string;
    description: string;
    price: number;
    categoryId: string;
  }): Observable<any> {
    const url = `${environment.URL}partner/hotel/add-dish`;
    return this.http.post(url, body, {
      headers: this.getAuthHeaders(),
    });
  }

  /**
   * Get dishes by hotel ID
   * GET /api/v1/hotel/dish/get/:hotelId
   */
  getDishesByHotelId(hotelId: string): Observable<any> {
    const url = `${environment.URL}hotel/dish/get/${hotelId}`;
    return this.http.get(url, {
      headers: this.getAuthHeaders(),
    });
  }

  /**
   * Get dish by ID
   * GET /api/v1/partner/get-dish/:dishId
   */
  getDishById(dishId: string): Observable<any> {
    const url = `${environment.URL}partner/get-dish/${dishId}`;
    return this.http.get(url, {
      headers: this.getAuthHeaders(),
    });
  }

  /**
   * Update dish
   * PUT /api/v1/partner/hotel/dish/update
   * stock: 1 = in stock (available), 0 = out of stock
   */
  updateDish(body: {
    dishId: string;
    name?: string;
    description?: string;
    price?: number;
    categoryId?: string;
    stock?: number; // 1 = in stock, 0 = out of stock
  }): Observable<any> {
    const url = `${environment.URL}partner/hotel/dish/update`;
    return this.http.put(url, body, {
      headers: this.getAuthHeaders(),
    });
  }

  /**
   * Delete dish
   * DELETE /api/v1/partner/hotel/dish/delete
   */
  deleteDish(dishId: string): Observable<any> {
    const url = `${environment.URL}partner/hotel/dish/delete`;
    return this.http.delete(url, {
      headers: this.getAuthHeaders(),
      body: { dishId },
    });
  }

  /**
   * Upload dish image
   * POST /api/v1/partner/hotel/dish/upload-image
   */
  uploadDishImage(formData: FormData): Observable<any> {
    const url = `${environment.URL}partner/hotel/dish/upload-image`;
    const headers = new HttpHeaders({
      'x-access-token': this.accessToken.value || '',
    });
    return this.http.post(url, formData, { headers });
  }
}
