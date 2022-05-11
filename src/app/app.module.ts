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
import { UpperbarComponent } from './upperbar/upperbar.component';
import { FiltersComponent } from './filters/filters.component';
import { SubUpperBarComponent } from './sub-upper-bar/sub-upper-bar.component';
import { MapComponent } from './map/map.component';
import { ViewComponent } from './view/view.component';
// import { AgmCoreModule } from '@agm/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon'
import { SimplePieComponent } from './widgets/simple-pie/simple-pie.component';
import { SimpleDonutComponent } from './widgets/simple-donuts/simple-donuts.component';
//---------------------------------------------------------------------------------------
import { GridManager } from './grid/grid-manager/grid-manager.component';
import { HistoColumnComponent } from './widgets/histocolumn/histocolumn.component';
import { HistoRowComponent } from './widgets/historow/historow.component';
import { GaugeComponent } from './widgets/gauge/gauge.component';
import { httpInterceptorProviders } from './http-interceptors/index';
import { SliceDice } from './middle/Slice&Dice';
import { SliceTable } from './middle/SliceTable';
import { PieTargetComponent } from './widgets/pie-target/pie-target.component';

import { AgGridModule } from 'ag-grid-angular';
import { TableComponent } from './widgets/table/table.component';
import { HistoColumnTargetComponent } from './widgets/histocolumn-target/histocolumn-target.component';
import { EditCellRenderer, CheckboxEnduitCellRenderer, CheckboxP2cdCellRenderer, PointFeuCellRenderer, TargetCellRenderer } from './widgets/table/renderers';

import { HistocurveComponent } from './widgets/histocurve/histocurve.component';
import { InfoBarComponent } from './map/info-bar/info-bar.component';
import { MapFiltersComponent } from './map/map-filters/map-filters.component';
import { MapSelectComponent } from './map/map-select/map-select.component';
import { RootLevelOnlyDirective } from './behaviour/root-level-only.directive';
import { AccountInfoComponent } from './general/account-info/account-info.component';
import { DescriptionWidgetComponent } from './widgets/description-widget/description-widget.component';
import { SearchbarComponent } from './general/searchbar/searchbar.component';
import { SuggestionBox } from './general/suggestionbox/suggestionbox.component';
import { PatternPipe } from './general/searchbar/pattern.pipe';
import { DataService } from './services/data.service';
import { AuthService } from './connection/auth.service';
import { MapLegendComponent } from './map/map-legend/map-legend.component';
import { ConditionnalDirective } from './behaviour/conditionnal.directive';
import { TooltipComponent } from './widgets/tooltip/tooltip.component';
import { LoginServerInfoComponent } from './login-page/login-server-info/login-server-info.component';
import { InfobarQuitComponent } from './map/infobar-quit/infobar-quit.component';

import { SocialLoginModule, SocialAuthServiceConfig } from 'angularx-social-login';
import { GoogleLoginProvider } from 'angularx-social-login';

import { MsalModule, MsalInterceptor } from '@azure/msal-angular';	
import { InteractionType, PublicClientApplication } from '@azure/msal-browser';

export const protectedResourceMap = new Map([
  ['https://graph.microsoft.com/v1.0/me', ['user.read']]
]);


@NgModule({
  declarations: [
    AppComponent,
    LoginPageComponent,
    CheckboxComponent,
    LoginFormComponent,
    UpperbarComponent,
    FiltersComponent,
    SubUpperBarComponent,
    MapComponent,
    ViewComponent,
    SimplePieComponent,
    SimpleDonutComponent,
    //------------------------
    GridManager,
    HistoColumnComponent,
    HistoRowComponent,
    TableComponent,
    EditCellRenderer,
    CheckboxEnduitCellRenderer,
    CheckboxP2cdCellRenderer,
    PointFeuCellRenderer,
    TargetCellRenderer,
    GaugeComponent,
    PieTargetComponent,
    HistoColumnTargetComponent,
    HistocurveComponent,
    InfoBarComponent,
    MapFiltersComponent,
    MapSelectComponent,
    RootLevelOnlyDirective,
    AccountInfoComponent,
    DescriptionWidgetComponent,
    SearchbarComponent,
    SuggestionBox,
    PatternPipe,
    MapLegendComponent,
    ConditionnalDirective,
    TooltipComponent,
    LoginServerInfoComponent,
    InfobarQuitComponent
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
    AgGridModule.withComponents([]),
    SocialLoginModule,
    MsalModule.forRoot( new PublicClientApplication({
      auth: {
        clientId: 'b091feff-ddd8-44e0-8805-e53ab3fd1198', // Application (client) ID from the app registration
        authority: 'https://login.microsoftonline.com/f658eec8-e605-4463-b498-b710edcf4df3', // The Azure cloud instance and the app's sign-in audience (tenant ID, common, organizations, or consumers)
        redirectUri: 'visio.fantasiapp.tech/temp/login'// This is your redirect URI
      },
      cache: {
        cacheLocation: 'localStorage',
      }
    }), 
    {
      interactionType: InteractionType.Popup, // MSAL Guard Configuration
            authRequest: {
              scopes: ['user.read']
            }
    }, {
      interactionType: InteractionType.Redirect, // MSAL Interceptor Configuration
      protectedResourceMap
  })
  ],
  providers: [httpInterceptorProviders, DataService, AuthService,
    {
      provide: 'SocialAuthServiceConfig',
      useValue: {
        autoLogin: false,
        providers: [
          {
            id: GoogleLoginProvider.PROVIDER_ID,
            provider: new GoogleLoginProvider(
              '519402531364-t2ohmkrspjel0d2iv6a5n9i4ga2u6bvh.apps.googleusercontent.com'
            )
          }
        ]
      } as SocialAuthServiceConfig,
    }    ],
  bootstrap: [AppComponent],
})
export class AppModule {}
