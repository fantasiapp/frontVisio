import { AuthGuard } from './connection/auth.guard';
import { SimplePieComponent } from './widgets/simple-pie/simple-pie.component';
import { ViewComponent } from './view/view.component';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { FiltersComponent } from './filters/filters.component';
import { LoggedPageComponent } from './logged-page/logged-page.component';
import { LoginPageComponent } from './login-page/login-page.component';
import { PublicPageComponent } from './public-page/public-page.component';
import { GridManager } from './grid/grid-manager/grid-manager.component';
import { MapComponent } from './map/map.component';
import { MapSelectComponent } from './map/map-select/map-select.component';
import { AccountInfoComponent } from './logged-page/account-info/account-info.component';
//import { PieChartComponent } from './widgets/piechart/piechart.component';
// const routes: Routes = []

const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  {path: 'login', redirectTo: 'login', pathMatch: 'full'},

  {
    path: 'login',
    component: LoginPageComponent,
  },
  {
    path: 'logged',
    component: ViewComponent, 
    canActivate:[AuthGuard],
  },
  {
    path: 'filters',
    component: FiltersComponent,
    canActivate:[AuthGuard],
  },
  {
    path: 'account',
    component: AccountInfoComponent
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
  providers: [AuthGuard]
})
export class AppRoutingModule { }
