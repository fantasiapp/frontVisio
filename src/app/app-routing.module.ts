import { AuthGuard } from './connection/auth.guard';
import { ViewComponent } from './view/view.component';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { FiltersComponent } from './filters/filters.component';
import { LoginPageComponent } from './login-page/login-page.component';
import { SearchbarComponent } from './logged-page/searchbar/searchbar.component';
import { SuggestionBox } from './logged-page/searchbar/suggestionbox/suggestionbox.component';
import { BlankComponent } from './general/blank/blank.component';
//import { PieChartComponent } from './widgets/piechart/piechart.component';
// const routes: Routes = []

const routes: Routes = [
  { path: 'blank', component: BlankComponent },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', redirectTo: 'login', pathMatch: 'full' },

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
    path: 'search',
    component: SearchbarComponent
  },
  {
    path: 'box',
    component: SuggestionBox
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {onSameUrlNavigation: 'reload'})],
  exports: [RouterModule],
  providers: [AuthGuard]
})
export class AppRoutingModule { }
