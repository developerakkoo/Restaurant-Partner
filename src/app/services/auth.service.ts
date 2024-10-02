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
  shopId: BehaviorSubject<string> = new BehaviorSubject("");
  address: BehaviorSubject<string> = new BehaviorSubject("");
  constructor(private http: HttpClient,
              private storage: DataService
  ) { 
    this.init()
  }
  async init(){
    let token = await this.storage.get("accessToken");
    let userId = await this.storage.get("userId");
    let shopId = await this.storage.get("shopId");

    this.accessToken.next(token);
    this.userId.next(userId);
    this.shopId.next(shopId);
  }

  register(body:{}){
    return this.http.post(environment.URL + "partner/register", body);
  }

  login(body:{}){
    return this.http.post(environment.URL + "partner/login", body);
  }

  logout(){
   
  }


  getPartnerById(){
    return this.http.get(environment.URL + `partner/get/byId/${this.userId.value}`,{
      headers: {
        'x-access-token': this.accessToken.value,
      },})
  }

  updatePartnerById(body:{}){
    return this.http.put(environment.URL + `partner/update/${this.userId.value}`,body,{
      headers: {
        'x-access-token': this.accessToken.value,
      },})
  }
  hotelRegister(name:any, address:any, category:any[]){
    return this.http.post(environment.URL + `partner/hotel/register`, {
      hotelName: name,
      userId:this.userId.value,
      address:address,
      category
    },{
      headers: {
        'x-access-token': this.accessToken.value,
      },})
  }

  uploadImage(formdata:any){
    console.log("data in upload image http function");
    console.log(formdata);
    
    
    return this.http.post(environment.URL + `partner/document/upload`, formdata)
  }
  uploadServiceImage(formdata:any){
    return this.http.post(environment.URL + `partner/service/upload-image`, formdata,{
      headers: {
        'x-access-token': this.accessToken.value,
      },})
  }
  setHotelLiveStatus(isOnline:number, hotelId:any){
    return this.http.put(environment.URL + `partner/hotel/update`,{
      hotelId:hotelId,
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
    return this.http.put(environment.URL + `partner/category/${categoryId}/toggleStoke/${this.shopId.value}`,{
     
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

  addService(body:any){
    return this.http.post(environment.URL + `partner/service/add`, body,{
      headers: {
        'x-access-token': this.accessToken.value,
      },})
  }


  editService(body:any,id:any){
    return this.http.post(environment.URL + `partner/service/update/${id}`, body,{
      headers: {
        'x-access-token': this.accessToken.value,
      },})
  }
  getAllOrders(status:any){
   return this.http.get(environment.URL + `partner/get/orders?hotelId=${this.shopId.value}&status=${status}&populate=1`,{
      headers: {
        'x-access-token': this.accessToken.value,
      },})
  }
  getAllCategory(){
    return this.http.get(environment.URL + `partner/category/getAll`,{
      headers:{
        'x-access-token': this.accessToken.value.toString()
      }
    });
  }

  updateOrderStatus(orderId:any, status:any){
    return this.http.put(environment.URL + `order/update/order-status`,{
      orderId,
      status
    },{
      headers:{
        'x-access-token': this.accessToken.value.toString()
      }
    })
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

  getAllLaundryServices(){
    return this.http.get(environment.URL + `partner/service/get/shopId/${this.shopId.value.toString()}`,{
      headers:{
        'x-access-token': this.accessToken.value.toString()
      }
    })
  }

  getAllHotelProductsById(hotelId:any){
    return this.http.get(environment.URL + `hotel/dish/get/${hotelId}`,{
      headers:{
        'x-access-token': this.accessToken.value.toString()
      }
    })
  }

  getAllHotelsPartner(){
    return this.http.get(environment.URL + `partner/get/hotels/${this.userId.value.toString()}`,{
      headers:{
        'x-access-token': this.accessToken.value.toString()
      }
    })
  }

  getAllNotificationsPartner(){
    return this.http.get(environment.URL + `notification/get/all/user/${this.userId.value.toString()}`,{
      headers:{
        'x-access-token': this.accessToken.value.toString()
      }
    })
  }
}
