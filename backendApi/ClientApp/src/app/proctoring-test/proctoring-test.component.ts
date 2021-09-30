import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SERVER_URL } from 'src/utils/CONSTANT'; 

@Component({
  selector: 'app-proctoring-test',
  templateUrl: './proctoring-test.component.html',
  styleUrls: ['./proctoring-test.component.css']
})
export class ProctoringTestComponent implements OnInit  {

  user_name:string = "";
  image_url:string = "";

  // SERVER_URL = "https://localhost:5001/";

  constructor(private http: HttpClient,private route: ActivatedRoute) {
    
   }

  requestCamera = async() => {
    let msg:string;
    try {
      await navigator.mediaDevices.getUserMedia();
    } catch (err) {
      if (err.name === "PermissionDeniedError" || err.name === "NotAllowedError")
        msg = "camera permission denied";
      else if (err.name === "SourceUnavailableError")
        msg = "camera not available";
      console.log(`Camera Error: ${msg}: ${err.message || err}`);
      return null;
    }
  }

  ngOnInit(){
    this.route.params.subscribe((params) => {
      this.user_name = params['label'];  
    });

    this.http
        .get(SERVER_URL + "users?label=" + this.user_name, {
          headers: new HttpHeaders(),
        }).subscribe((data:any) => {
          this.image_url = data;
        });    

  }
}
