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
    if (ev.target.files && ev.target.files.length > 0) {
      this.fileName = ev.target.files[0].name;  // Capture the file name
      this.file = ev.target.files[0];  // Capture the file
      console.log("File selected:", this.file);  // Log to verify
  
      // Emit the file and type
      this.fileEvent.emit({
        file: this.file, 
        type: this.fileType  // Make sure `fileType` is correctly initialized
      });
    } else {
      console.error("No file selected.");
    }
  }

}
