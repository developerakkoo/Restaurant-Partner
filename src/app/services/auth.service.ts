import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { DataService } from './data.service';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  userAuthState:BehaviorSubject<any> = new BehaviorSubject(false);
  accessToken: BehaviorSubject<string> = new BehaviorSubject("");
  userId: BehaviorSubject<string> = new BehaviorSubject("");
  hotelId: BehaviorSubject<string> = new BehaviorSubject("");
  address: BehaviorSubject<string> = new BehaviorSubject("");
  constructor(private http: HttpClient,
              private storage: DataService
  ) { 
    this.init()
  }
  async init(){
    let token = await this.storage.get("accessToken");
    let userId = await this.storage.get("userId");
    let hotelId = await this.storage.get("hotelId");

    this.accessToken.next(token);
    this.userId.next(userId);
  }

  register(body:{}){
    return this.http.post(environment.URL + "auth/partner/register", body);
  }

  login(body:{}){
    return this.http.post(environment.URL + "auth/partner/login", body);
  }

  getPartnerById(){
    return this.http.get(environment.URL + ``,{
      headers: {
        'x-access-token': this.accessToken.value,
      },})
  }
  hotelRegister(name:any, address:any){
    return this.http.post(environment.URL + `partner/hotel/register`, {
      hotelName: name,
      userId:this.userId.value,
      address:address
    },{
      headers: {
        'x-access-token': this.accessToken.value,
      },})
  }

  uploadHotelImage(formdata:any){
    return this.http.post(environment.URL + `partner/hotel/upload/image`, formdata,{
      headers: {
        'x-access-token': this.accessToken.value,
      },})
  }
  setHotelLiveStatus(isOnline:number){
    return this.http.put(environment.URL + `partner/hotel/update`,{
      hotelId:this.hotelId.value,
      isOnline:isOnline
    },{
      headers: {
        'x-access-token': this.accessToken.value,
      },})
  }
  getPartnerDashboard(){
    return this.http.get(environment.URL + `partner/get/dashboard/${this.userId.value}`,{
      headers: {
        'x-access-token': this.accessToken.value,
      },})
  }

  getPartnerEarnings(startDate:any, endDate:any){
    return this.http.get(environment.URL + `partner/get/earnings/${this.userId.value}?startDate=${startDate}&endDate=${endDate}`,{
      headers: {
        'x-access-token': this.accessToken.value,
      },})
  }

  markCategoryStockStatus(isOutOfStock:number,categoryId:string){
    return this.http.put(environment.URL + `partner/category/${categoryId}/toggleStoke/${this.hotelId.value}`,{
     
     isOutOfStock:isOutOfStock
    },{
      headers: {
        'x-access-token': this.accessToken.value,
      },})
  }

  markDishStockStatus(stock:number,dishId:string){
    return this.http.put(environment.URL + `partner/hotel/dish/update`,{
     dishId,
     stock
    },{
      headers: {
        'x-access-token': this.accessToken.value,
      },})
  }

  addProduct(body:{}){

  }

  getAllOrders(status:any){
   return this.http.get(environment.URL + `partner/get/orders?hotelId=${this.hotelId.value}&status=${status}&populate=1`,{
      headers: {
        'x-access-token': this.accessToken.value,
      },})
  }
  getAllCategory(){
    return this.http.get(environment.URL + `admin/category/get/all`,{
      headers:{
        'x-access-token': this.accessToken.value.toString()
      }
    });
  }

  AcceptRejectOrder(orderId:any, status:any){
    return this.http.put(environment.URL + `order/accept-reject`,{
      orderId,
      status
    },{
      headers:{
        'x-access-token': this.accessToken.value.toString()
      }
    })
  }

  getAllHotelProducts(){
    return this.http.get(environment.URL + ``,{
      headers:{
        'x-access-token': this.accessToken.value.toString()
      }
    })
  }
}
