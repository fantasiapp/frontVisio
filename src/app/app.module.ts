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
import { AgentOnlyDirective } from './behaviour/agent-only.directive';
import { RootLevelOnlyDirective } from './behaviour/root-level-only.directive';
import { AccountInfoComponent } from './logged-page/account-info/account-info.component';
import { DescriptionWidgetComponent } from './widgets/description-widget/description-widget.component';
import { LoggerService } from './behaviour/logger.service';
import { SearchbarComponent } from './logged-page/searchbar/searchbar.component';
import { SuggestionBox } from './logged-page/searchbar/suggestionbox/suggestionbox.component';
import { PatternPipe } from './logged-page/searchbar/pattern.pipe';
import { BlankComponent } from './general/blank/blank.component';
import { DataService } from './services/data.service';
import { AuthService } from './connection/auth.service';
import { AgentFinitionsOnlyDirective } from './behaviour/agent-finitions-only.directive';

@NgModule({
  declarations: [
    AppComponent,
    LoginPageComponent,
    CheckboxComponent,
    LoginFormComponent,
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
    AgentOnlyDirective,
    RootLevelOnlyDirective,
    AccountInfoComponent,
    DescriptionWidgetComponent,
    SearchbarComponent,
    SuggestionBox,
    PatternPipe,
    BlankComponent,
    AgentFinitionsOnlyDirective
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
  providers: [SliceDice, httpInterceptorProviders, SliceTable, DataService, AuthService],
  bootstrap: [AppComponent],
})
export class AppModule {}
