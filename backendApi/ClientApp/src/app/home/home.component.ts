import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';

import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

//CONSTANTS
import { SERVER_URL } from 'src/utils/CONSTANT';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
})
export class HomeComponent {
  selectUserForm = new FormGroup({
    label: new FormControl('', [Validators.required]),
  });

  userList = [];
  selectedUser = '';
  constructor(private http: HttpClient,private router: Router, private route: ActivatedRoute) {}

  // SERVER_URL = "https://localhost:5001/";

  ngOnInit(): void {
    this.http
        .get(SERVER_URL+'users/AllLabels', {
          headers: new HttpHeaders(),
        }).subscribe((users:any) => {
          this.userList = users;
          if(this.userList.length > 0)
          this.selectedUser = this.userList[0];
        });    
  }

  selectUser(event:any){
    this.selectedUser = event.target.value;
    console.log(this.selectedUser);
  }

  goToAddUser() {
    this.router.navigate(['../', 'add-user'], { relativeTo: this.route });
  }

  goToProctoringTest(){
    this.router.navigate(['../', 'proctoring-test',this.selectedUser], {
      relativeTo: this.route,
    });
  }
}
