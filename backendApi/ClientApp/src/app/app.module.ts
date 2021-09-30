import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';

import { AppComponent } from './app.component';
import { NavMenuComponent } from './nav-menu/nav-menu.component';
import { HomeComponent } from './home/home.component';
import { AddUserComponent } from './add-user/add-user.component';
import { CounterComponent } from './counter/counter.component';
import { ProctoringTestComponent } from './proctoring-test/proctoring-test.component';
import { FetchDataComponent } from './fetch-data/fetch-data.component';

@NgModule({
  declarations: [
    AppComponent,
    NavMenuComponent,
    HomeComponent,
    AddUserComponent,
    CounterComponent,
    ProctoringTestComponent,
    FetchDataComponent
  ],
  imports: [
    BrowserModule.withServerTransition({ appId: 'ng-cli-universal' }),
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule.forRoot([
      { path: '', component: HomeComponent, pathMatch: 'full' },
      { path: 'add-user', component: AddUserComponent },
      { path: 'counter', component: CounterComponent },
      { path: 'proctoring-test', component: ProctoringTestComponent },
      { path: 'proctoring-test/:label', component: ProctoringTestComponent},
      { path: 'fetch-data', component: FetchDataComponent },
      { path: '**', redirectTo: '' },
    ])
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
