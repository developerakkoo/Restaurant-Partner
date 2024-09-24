import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-upload-file',
  templateUrl: './upload-file.component.html',
  styleUrls: ['./upload-file.component.scss'],
})
export class UploadFileComponent  implements OnInit {

  file!:File;
  fileName!:string;
  @Input() fileType:any;


  @Output() fileEvent = new EventEmitter();
  constructor() { }

  ngOnInit() {}


  fileUpload(ev:any){
    console.log(ev.target.files[0]);
    this.fileName = ev.target.files[0]['name'];
    this.file = ev.target.files[0];
    this.fileEvent.emit({file: this.file, type: this.fileType});
  }

}
