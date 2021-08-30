import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LoginPageComponent } from './login-page/login-page.component';
import { CheckboxComponent } from './general/checkbox/checkbox.component';
import { HttpClientModule } from '@angular/common/http';
import { LoginFormComponent } from './login-page/login-form/login-form.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DataStatComponent } from './data-stat/data-stat.component';
import { LoggedPageComponent } from './logged-page/logged-page.component';
import { PublicPageComponent } from './public-page/public-page.component';
import { UpperbarComponent } from './upperbar/upperbar.component';
import { FiltersComponent } from './filters/filters.component';
import { SearchFieldComponent } from './general/search-field/search-field.component';
import { SubUpperBarComponent } from './sub-upper-bar/sub-upper-bar.component';
@NgModule({
  declarations: [
    AppComponent,
    LoginPageComponent,
    CheckboxComponent,
    LoginFormComponent,
    DataStatComponent,
    LoggedPageComponent,
    PublicPageComponent,
    UpperbarComponent,
    FiltersComponent,
    SearchFieldComponent,
    SubUpperBarComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    BrowserAnimationsModule,
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
