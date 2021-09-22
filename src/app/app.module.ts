import { MatSelectModule } from '@angular/material/select';
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
import { MapComponent } from './map/map.component';
import { ViewComponent } from './view/view.component';
// import { AgmCoreModule } from '@agm/core';
import { Navigation } from './middle/Navigation';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { SelectComponent } from './general/select/select.component';
import { MatIconModule } from '@angular/material/icon'
import { SimplePieComponent } from './widgets/simple-pie/simple-pie.component';
import { SimpleDonutComponent } from './widgets/simple-donuts/simple-donuts.component';
//---------------------------------------------------------------------------------------
import { GridManager } from './grid/grid-manager/grid-manager.component';
import { HistoColumnComponent } from './widgets/histocolumn/histocolumn.component';
import { HistoRowComponent } from './widgets/historow/historow.component';
import { httpInterceptorProviders } from './http-interceptors/index';

import { AgGridModule } from 'ag-grid-angular';
import { TableComponent } from './widgets/table/table.component';

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
    MapComponent,
    ViewComponent,
    SelectComponent,
    SimplePieComponent,
    SimpleDonutComponent,
    //------------------------
    GridManager,
    HistoColumnComponent,
    HistoRowComponent,
    TableComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    MatInputModule,
    ReactiveFormsModule,
    BrowserAnimationsModule,
    MatSelectModule,
    MatFormFieldModule,
    MatIconModule,
    // AgmCoreModule.forRoot({
    //   apiKey:''
    // })
    AgGridModule.withComponents([])
  ],
  providers: [Navigation, httpInterceptorProviders],
  bootstrap: [AppComponent],
})
export class AppModule {}
