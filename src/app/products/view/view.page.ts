import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { AlertController, LoadingController, ModalController, ToastController } from '@ionic/angular';
import { AuthService } from 'src/app/services/auth.service';
import { DataService } from 'src/app/services/data.service';
import { EditPage } from '../edit/edit.page';
import { Router } from '@angular/router';

@Component({
  selector: 'app-view',
  templateUrl: './view.page.html',
  styleUrls: ['./view.page.scss'],
})
export class ViewPage implements OnInit {

  hotelId: any;
  dishes: any[] = [];
  
  constructor(
    private data: DataService,
    private loadingController: LoadingController,
    private auth: AuthService,
    private router: Router,
    private alertController: AlertController,
    private modalController: ModalController,
    private toastController: ToastController
  ) { }

  async ngOnInit() {
    // Load hotel ID from storage or auth service
    const hotelData = await this.data.get('hotelData');
    if (hotelData) {
      const hotel = JSON.parse(hotelData);
      this.hotelId = hotel._id;
    } else if (this.auth.shopData.value) {
      this.hotelId = this.auth.shopData.value._id;
    }
    console.log('Hotel ID for dishes:', this.hotelId);
  }

  ionViewDidEnter() {
    this.getAllDishes();
  }

  async getAllDishes() {
    if (!this.hotelId) {
      console.error('Hotel ID not found');
      return;
    }

    const loading = await this.loadingController.create({
      message: "Loading dishes...",
    });

    await loading.present();

    this.auth.getDishesByHotelId(this.hotelId)
      .subscribe({
        next: async (value: any) => {
          console.log('Dishes response:', value);
          // Handle different response structures
          if (value?.data) {
            if (Array.isArray(value.data)) {
              this.dishes = value.data;
            } else if (value.data.content && Array.isArray(value.data.content)) {
              this.dishes = value.data.content;
            } else if (value.data.dishes && Array.isArray(value.data.dishes)) {
              this.dishes = value.data.dishes;
            } else {
              this.dishes = [];
            }
          } else if (Array.isArray(value)) {
            this.dishes = value;
          } else {
            this.dishes = [];
          }
          await loading.dismiss();
        },
        error: async (error: HttpErrorResponse) => {
          console.error('Error fetching dishes:', error);
          await loading.dismiss();
        }
      });
  }

 
  async presentModalEditDish(item: any) {
    console.log("Edit dish:", item._id);
    this.router.navigate(['products', 'edit', item._id]);
  }

  async presentAlertConfirmDelete(item: any) {
    const alert = await this.alertController.create({
      header: 'Delete Dish?',
      message: 'Are you sure you want to delete this dish? This action cannot be undone.',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          cssClass: 'secondary',
          handler: () => {
            console.log('Delete cancelled');
          }
        }, {
          text: 'Delete',
          role: 'destructive',
          handler: () => {
            console.log('Confirm delete');
            this.deleteDish(item);
          }
        }
      ]
    });

    await alert.present();
  }

  async deleteDish(item: any) {
    const loading = await this.loadingController.create({
      message: 'Deleting dish...',
    });

    await loading.present();

    this.auth.deleteDish(item._id)
      .subscribe({
        next: async (value: any) => {
          console.log('Dish deleted:', value);
          await loading.dismiss();
          this.getAllDishes(); // Refresh list
        },
        error: async (error: HttpErrorResponse) => {
          console.error('Error deleting dish:', error);
          await loading.dismiss();
        }
      });
  }

  /**
   * Handle image load error by setting placeholder
   */
  handleImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    if (img) {
      img.src = 'assets/icon/dish-placeholder.png';
    }
  }

  /**
   * Toggle dish stock status (in stock / out of stock)
   * Toggle checked = in stock (stock = 1)
   * Toggle unchecked = out of stock (stock = 0)
   * API expects: stock: 1 = in stock, stock: 0 = out of stock
   */
  async toggleDishStock(item: any, event: any) {
    const isChecked = event.detail.checked;
    const stock = isChecked ? 1 : 0; // checked = in stock (1), unchecked = out of stock (0)
    
    console.log('Toggling dish stock:', { dishId: item._id, stock, isChecked });
    
    // Update dish with stock status
    this.auth.updateDish({
      dishId: item._id,
      stock: stock
    }).subscribe({
      next: async (value: any) => {
        console.log('Dish stock status updated:', value);
        // Update local item state
        item.stock = stock;
        const toast = await this.toastController.create({
          message: isChecked ? 'Dish marked as in stock' : 'Dish marked as out of stock',
          duration: 2000,
          color: 'success',
          position: 'bottom'
        });
        await toast.present();
      },
      error: async (error: HttpErrorResponse) => {
        console.error('Error updating dish stock status:', error);
        console.error('Error details:', error.error);
        // Revert toggle on error
        event.detail.checked = !isChecked;
        const toast = await this.toastController.create({
          message: 'Failed to update stock status. Please try again.',
          duration: 2000,
          color: 'danger',
          position: 'bottom'
        });
        await toast.present();
      }
    });
  }



}
