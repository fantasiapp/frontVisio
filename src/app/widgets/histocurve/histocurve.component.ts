import { ChangeDetectionStrategy, Component, ElementRef, ViewChild } from '@angular/core';
import {bar, bb, line} from 'billboard.js';
import * as d3 from 'd3';
import { FiltersStatesService } from 'src/app/filters/filters-states.service';
import { SliceDice } from 'src/app/middle/Slice&Dice';
import { BasicWidget } from '../BasicWidget';
import { HistoColumnComponent } from '../histocolumn/histocolumn.component';

@Component({
  selector: 'app-histocurve',
  templateUrl: '../widget-template.html',
  styleUrls: ['./histocurve.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HistocurveComponent extends HistoColumnComponent {
  @ViewChild('content', {read: ElementRef})
  protected content!: ElementRef;
  
  constructor(protected ref: ElementRef, protected filtersService: FiltersStatesService, protected sliceDice: SliceDice) {
    super(ref, filtersService, sliceDice);
  }

  createGraph(d: any, opt: {} = {}) {
    let {data, colors} = d;
    let self = this;
    
    if ( data[0][0] != 'x' ) {
      console.log('[HistoColumn]: Rendering inaccurate format because `x` axis is unspecified.')
      data = [['x', ...data.map((d: any[]) => d[0])], ...data];
    };

    super.createGraph(d, {
      data: {
        x: data[0][0] == 'x' ? 'x' : undefined, /* ⚠️⚠️ inaccurate format ⚠️⚠️ */
        columns: data,
        types: {
          'histo': bar(),
          'curve': line()
        },
        order: null
      },
      tooltip: {
        contents: (d: any, defaultTitleFormat: string, defaultValueFormat: string, color: any) => {
          return `
            <div class="tooltip">
              <span style="color:${color(d[0])}">${d[0].id}: </span>${BasicWidget.format(d[0].value, 3)} ${this.properties.unit}
              <br/>
              <span style="color:${color(d[1])}">${d[1].id}: </span>${BasicWidget.format(d[1].value, 3)} ${this.properties.unit}
              <div class="tooltip-tail"></div>
            </div>
          `;
        },
        position: (data: any, width: number, height: number, element: any, pos: {x: number, y: number, xAxis?: number}) => {
          let axisPadding = 0;
          let maxBottom = this.rectHeight - 30; //30 css padding
          return {
            top: axisPadding + maxBottom / 2,
            left: (pos.xAxis || pos.x) + 40
          };
        }
      },
      point: {
        r: 4
      },
      line: {
        
      },
      ...opt
    })
  }
}
