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
  fileUploadCount:number = 0;
  constructor(private modalController: ModalController,
              private router: Router,
              private auth: AuthService
  ) { }

  ngOnInit() {

    console.log(this.userId);
    
  }

  fileUpload(ev:any){
    console.log("Event recieved file");
    
    console.log(ev);
    console.log(ev['file']);
    let file = ev['file'];
    let type = ev['type'];
    let formdata = new FormData();
    formdata.append("file", file, file.name);
    formdata.append("userId", this.userId);
    formdata.append("documentType", type);
 // Use type assertion to avoid the TypeScript error
 for (let pair of (formdata as any).entries()) {
  console.log(pair[0] + ': ' + pair[1]);
}
      // Log the file details
  if (file instanceof File) {
    console.log("File Name:", file.name);
    console.log("File Type:", file.type);
    console.log("File Size:", file.size);
  }

  // Log individual fields manually
  console.log("User ID:", formdata.get("userId"));
  console.log("Document Type:", formdata.get("documentType"));
    
    this.auth.uploadImage(formdata)
    .subscribe({
      next:(value:any) =>{
        console.log(value);
        this.fileUploadCount++;
        console.log(this.fileUploadCount);
        
        if(this.fileUploadCount == 2){
          this.next();
        }        
      },
      error:(error:HttpErrorResponse) =>{
        console.log("Error Occured while uploading file");
        
        console.log(error);
        
      }
    })
    
  }
  next(){
    this.fileUploadCount = 2;
    setTimeout(() =>{
      this.close();
      this.router.navigate(['tabs','tabs','tab1', ],{replaceUrl:true});
    },2000);
  }
  goBack(){

  }


  close(){
    this.modalController.dismiss();
  }

}
