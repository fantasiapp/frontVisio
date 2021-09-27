import { Component, Injectable, Input } from '@angular/core';
import { SimplePieComponent } from '../widgets/simple-pie/simple-pie.component';
import { SimpleDonutComponent } from '../widgets/simple-donuts/simple-donuts.component';
import { HistoColumnComponent } from '../widgets/histocolumn/histocolumn.component';
import { GridArea } from './grid-area/grid-area';
import { HistoRowComponent } from '../widgets/historow/historow.component';
import { GaugeComponent } from '../widgets/gauge/gauge.component';
import { TableComponent } from '../widgets/table/table.component';
import { PieTargetComponent } from '../widgets/pie-target/pie-target.component';
import { HistoColumnTargetComponent } from '../widgets/historow-target/histocolumn-target.component';
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
    console.log('[DefaultComponent]: Component not found, rendering default.') 
  }
}

function createDefaultComponent(name: string, src: string) {
  @Component({
    template: `
      <img [alt]="name" [src]="src"/>
    `,
    styles: [`
      :host {
        display: flex;
        justify-content: center;
        align-items: center;
      }
    `]
  })
  class DefaultImage extends GridArea {
    public name: string = name;
    public src: string = src;
    constructor() {
      super();
      console.log('[DefaultImage]: Component found but not initialized, rendering a default image.');
    }
  };

  return DefaultImage;
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
    'histoColumnTarget': HistoColumnTargetComponent
  };

  constructor() {
    console.log('[WidgetManager]: On.');
  }

  findComponent(name: string): any {
    console.log(`[WidgetManager -- findComponent]: Resolving "${name}".`);
    let component = this.mapping[name];
    console.log('[WidgetManager -- findComponent]: Component' + (component ? '' : ' not') + ' found.')
    if ( !component )
      return DefaultComponent;
    if ( typeof component === 'string' )
      return createDefaultComponent(name, component);
    return component;
  }
};