/**
 * Authentication Models and Interfaces
 * Type definitions for Partner authentication flow
 */

export interface PartnerRegisterRequest {
  name: string;
  email: string;
  phoneNumber: string;
  password: string; // Required for registration
}

export interface PartnerRegisterResponse {
  data: {
    _id: string;
    name: string;
    email: string;
    phoneNumber: string;
    createdAt?: string;
    updatedAt?: string;
  };
  message?: string;
  statusCode?: number;
}

export interface PartnerLoginRequest {
  phoneNumber: string;
}

export interface UserData {
  _id: string;
  name: string;
  email: string;
  phoneNumber: string;
  profile_image?: string;
  status?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface HotelData {
  _id: string;
  hotelName: string;
  image_url?: string;
  local_imagePath?: string;
  address: string;
  location?: {
    type: string;
    coordinates: number[];
  };
  isTop?: boolean;
  hotelStatus?: number;
  isOnline?: boolean;
  userId?: UserData | string;
  category?: any[];
}

export interface PartnerLoginResponse {
  data: {
    userId: UserData;
    hotelId: HotelData | null;
    hotelCount: number;
    accessToken: string;
    refreshToken: string;
  };
  message?: string;
  statusCode?: number;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  statusCode?: number;
}

export interface ApiError {
  message: string;
  error?: string;
  statusCode?: number;
}

