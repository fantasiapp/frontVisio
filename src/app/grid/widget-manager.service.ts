import { Component, Injectable, Input } from '@angular/core';
import { SimplePieComponent } from '../widgets/simple-pie/simple-pie.component';
import { SimpleDonutComponent } from '../widgets/simple-donuts/simple-donuts.component';
import { GridArea } from './grid-area/grid-area';


@Component({
  selector: 'simple-component',
  template: `
    <h1>{{properties.title}}</h1>
    <h3>{{properties.description}}</h3>
  `
})
export class DefaultComponent extends GridArea {

}

function createDefaultComponent(name: string, src: string) {

  @Component({
    template: `
      <img [alt]="name" [src]="src"/>
    `
  })
  class DefaultImage extends GridArea {
    
    public name: string = name;
    public src: string = src;
  };

  return DefaultImage;
}

@Injectable()
export class WidgetManagerService {

  private mapping: {[key:string]: any} = {
    'default': DefaultComponent,
    'pie': SimplePieComponent,
    'donut': SimpleDonutComponent,
    'historow': "assets/for-mock-view/pdm-enseigne.svg",
    'histocolumn': "assets/for-mock-view/pdm-enseigne.svg",
    'table': "assets/for-mock-view/pdm-enseigne.svg"
  };

  constructor() {
    console.log('[WidgetManager]: On.');
  }

  findComponent(name: string): any {
    console.log(name);
    let component = this.mapping[name];
    if ( !component )
      return DefaultComponent;
    if ( typeof component === 'string' )
      return createDefaultComponent(name, component);
    return component;
  }
};