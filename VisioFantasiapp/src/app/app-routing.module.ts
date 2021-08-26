import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { FiltersComponent } from './filters/filters.component';
import { LoggedPageComponent } from './logged-page/logged-page.component';
import { LoginPageComponent } from './login-page/login-page.component';
import { PublicPageComponent } from './public-page/public-page.component';
// const routes: Routes = []

const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  {
        path: 'login',
        component: LoginPageComponent,
  },
  {
        path: 'logged',
        component: LoggedPageComponent,
  },
  {
        path: 'filters',
        component: FiltersComponent,
  },
  // {
  //   path: '',
  //   component: LoggedPageComponent,
  //   children: [
  //     {
  //       path: ':annee',
  //       data: { breadcrumb: 'Annee' },
  //       children: [
  //         {
  //           path: '',{}
  //           data: { breadcrumb: null },
  //           component: DataViewComponent,
  //         }
  //       ],
  //     },
  //   ],
  // },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
