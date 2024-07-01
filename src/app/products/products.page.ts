import { Component, OnInit } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { LoadingController } from '@ionic/angular';
import { HttpBackend, HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-products',
  templateUrl: './products.page.html',
  styleUrls: ['./products.page.scss'],
})
export class ProductsPage implements OnInit {

  categories:any[] = [];
  form:FormGroup;
  constructor(private auth: AuthService,
              private router: Router,
              private fb: FormBuilder,
              private loadingController: LoadingController
  ) {
    this.form = this.fb.group({
      // hotelId:[,[]],
      categoryId:[,[Validators.required]],
      name:[,[Validators.required]],
      dishType:[,[Validators.required]],
      partnerPrice:[,[Validators.required]],
      spicLevel:[,[Validators.required]],
      stock:[,[Validators.required]],
      
    })
   }

  ngOnInit() {
  }


  ionViewDidEnter(){
    this.loadCategory();
  }

  loadCategory(){
    this.auth.getAllCategory()
    .subscribe({
      next:async(value:any) =>{
        console.log(value);
        this.categories = value['data']['content'];
      },
      error:async(error:HttpErrorResponse) =>{
        console.log(error.error);
        
      }
    })
  }

  async onSubmit(){
    if(this.form.valid){
      console.log(this.form.value);
      
    }
  }
}
