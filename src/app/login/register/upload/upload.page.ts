import { HttpErrorResponse } from '@angular/common/http';
import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ModalController } from '@ionic/angular';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-upload',
  templateUrl: './upload.page.html',
  styleUrls: ['./upload.page.scss'],
})
export class UploadPage implements OnInit {

  @Input() userId:any;
  fileUploadCount:number = 1;
  constructor(private modalController: ModalController,
              private router: Router,
              private auth: AuthService
  ) { }

  ngOnInit() {

    console.log(this.userId);
    
  }

  fileUpload(ev:any){
    console.log(ev);
    console.log(ev['file']);
    let file = ev['file'];
    let type = ev['type'];
    let formdata = new FormData();
    formdata.append("file", file, file.name);
    formdata.append("userId", this.userId);
    formdata.append("documentType", type);
    this.auth.uploadImage(formdata)
    .subscribe({
      next:async(value:any) =>{
        console.log(value);
        this.fileUploadCount++;
        if(this.fileUploadCount === 3){
          this.next();
        }        
      },
      error:async(error:HttpErrorResponse) =>{
        console.log(error);
        
      }
    })
    
  }
  next(){
    this.fileUploadCount = 3;
    this.router.navigate(['tabs','tabs','tab1']);
  }
  goBack(){

  }


  close(){
    this.modalController.dismiss();
  }

}
