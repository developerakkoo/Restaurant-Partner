import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { AlertController, LoadingController, ModalController } from '@ionic/angular';
import { AuthService } from 'src/app/services/auth.service';
import { DataService } from 'src/app/services/data.service';
import { EditPage } from '../edit/edit.page';

@Component({
  selector: 'app-view',
  templateUrl: './view.page.html',
  styleUrls: ['./view.page.scss'],
})
export class ViewPage implements OnInit {

  shopId:any;
  services:any[] =[];
  constructor(private data:DataService,
              private loadingController: LoadingController,
              private auth: AuthService,
              private alertController: AlertController,
              private modalController: ModalController
  ) { }

  ngOnInit() {


  }


  ionViewDidEnter(){
    this.getAllServices();
  }
  async getAllServices(){
    let loading = await this.loadingController.create({
      message:"Loading...",
    })

    await loading.present();

    this.auth.getAllLaundryServices()
    .subscribe({
      next:async(value:any) =>{
        console.log(value);
        this.services = value['data']['content'];
        await loading.dismiss();
      },
      error:async(error:HttpErrorResponse) =>{
        console.log(error);
        await loading.dismiss();

        
      }
    })
  }

 
  async presentModalEditSerive(item:any) {
    const modal = await this.modalController.create({
    component: EditPage,
    componentProps: { id: item._id }
    });
  
    await modal.present();
    const data = await modal.onDidDismiss();
    console.log(data)
  }
  async presentAlertConfirmDelete(item:any) {
    const alert = await this.alertController.create({
      header: 'Are you Sure?',
      message: 'Once deleted it cannot be undone.',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          cssClass: 'secondary',
          handler: () => {
            console.log('Confirm Cancel: blah');
          }
        }, {
          text: 'Okay',
          handler: () => {
            console.log('Confirm Okay');
            this.delete(item);
          }
        }
      ]
    });
  
    await alert.present();
  }

  edit(item:any){
    console.log(item._id);
    
  }


  delete(item:any){
    console.log(item._id);
    
  }



}
