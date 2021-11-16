import { AuthGuard } from './connection/auth.guard';
import { ViewComponent } from './view/view.component';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginPageComponent } from './login-page/login-page.component';
//import { PieChartComponent } from './widgets/piechart/piechart.component';
// const routes: Routes = []

const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  {
    path: 'login',
    component: LoginPageComponent,
  },
  {
    path: 'logged',
    component: ViewComponent, 
    canActivate:[AuthGuard],
  }, {
    path: '**',
    redirectTo: 'login'
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
  providers: [AuthGuard]
})
export class AppRoutingModule { }
