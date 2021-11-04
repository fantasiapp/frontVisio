import { Component, Injectable, Input } from '@angular/core';
import { SimplePieComponent } from '../widgets/simple-pie/simple-pie.component';
import { SimpleDonutComponent } from '../widgets/simple-donuts/simple-donuts.component';
import { HistoColumnComponent } from '../widgets/histocolumn/histocolumn.component';
import { GridArea } from './grid-area/grid-area';
import { HistoRowComponent } from '../widgets/historow/historow.component';
import { GaugeComponent } from '../widgets/gauge/gauge.component';
import { TableComponent } from '../widgets/table/table.component';
import { PieTargetComponent } from '../widgets/pie-target/pie-target.component';
import { HistoColumnTargetComponent } from '../widgets/histocolumn-target/histocolumn-target.component';
import { HistocurveComponent } from '../widgets/histocurve/histocurve.component';


@Component({
  selector: 'simple-component',
  template: `
    <h1>{{properties.title}}</h1>
    <h3>{{properties.description}}</h3>
  `
})
export class DefaultComponent extends GridArea {
  constructor() {
    super();
    console.warn('[DefaultComponent]: Component not found, rendering default.') 
  }
}

@Injectable()
export class WidgetManagerService {

  private mapping: {[key:string]: any} = {
    'default': DefaultComponent,
    'pie': SimplePieComponent,
    'donut': SimpleDonutComponent,
    'histoRow': HistoRowComponent,
    'histoColumn': HistoColumnComponent,
    'gauge': GaugeComponent,
    'table': TableComponent,
    'pieTarget': PieTargetComponent,
    'histoColumnTarget': HistoColumnTargetComponent,
    'histoCurve': HistocurveComponent
  };

  constructor() {
    console.debug('[WidgetManager]: On.');
  }

  findComponent(name: string): any {
//    console.log('resolving component', name);
    let component = this.mapping[name];
    if ( !component )
      return DefaultComponent;
    return component;
  }
};