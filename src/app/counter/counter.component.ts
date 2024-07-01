import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-counter',
  templateUrl: './counter.component.html',
  styleUrls: ['./counter.component.scss'],
})
export class CounterComponent  implements OnInit {

  countMinutes:number = 5;
  constructor() { }

  ngOnInit() {}


  increment(){
    console.log("+");
    if(this.countMinutes >=180){
      return;
    }
    this.countMinutes = this.countMinutes + 5;
  }

  decrement(){
    console.log("-");
    
    if(this.countMinutes <= 5){
      return;
    }
    this.countMinutes = this.countMinutes - 5;
  }
}
