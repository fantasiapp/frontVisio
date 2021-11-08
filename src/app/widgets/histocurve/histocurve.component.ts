import { ChangeDetectionStrategy, Component, ElementRef, ViewChild } from '@angular/core';
import {bar, bb, Chart, line} from 'billboard.js';
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

  protected computeMax(data: any) {
    let max = data.slice(1).map((d: any[]) => Math.max.apply(null, d.slice(1))).map(Math.round);
    return [max[0], Math.min(100, max[1]*1.2)];
  }

  protected getTickValues(max: any = this.maxValue): any {
    let ticks = [super.getTickValues(this.maxValue[0]), [0, 20, 40, 60, 80, 100]];
    //since y2 is fixed in the histocurve
    //close values will be an issue, so define a fixed axisfor now
    return ticks;
  }

  createGraph(d: any, opt: {} = {}) {
    let {data} = d;
    
    if ( data[0][0] != 'x' ) {
      console.log('[HistoColumn]: Rendering inaccurate format because `x` axis is unspecified.')
      data = [['x', ...data.map((d: any[]) => d[0])], ...data];
    };

    this.maxValue = this.computeMax(data);
    let ticks = this.getTickValues();

    super.createGraph(d, {
      data: {
        x: data[0][0] == 'x' ? 'x' : undefined, /* ⚠️⚠️ inaccurate format ⚠️⚠️ */
        y: data.slice(1).map((d: any) => d[0]),
        columns: data,
        types: {
          [data[1][0]]: bar(),
          [data[2][0]]: line()
        },
        axes: {
          [data[1][0]]: 'y',
          [data[2][0]]: 'y2'
        },
        order: null
      },
      tooltip: {
        contents: (d: any, defaultTitleFormat: string, defaultValueFormat: string, color: any) => {
          let units = this.properties.unit.split('|');
          return `
            <div class="tooltip">
              <span style="color:${color(d[0])}">${d[0].id}: </span>${BasicWidget.format(d[0].value, 3, units[1].toLowerCase() == 'pdv')} ${units[1]}
              <br/>
              <span style="color:${color(d[1])}">${d[1].id}: </span>${BasicWidget.format(d[1].value, 3, units[0].toLowerCase() == 'pdv')} ${units[0]}
              <div class="tooltip-tail"></div>
            </div>
          `;
        },
        position: (data: any, width: number, height: number, element: any, pos: any) => {
          let xAxisPadding = width/2, yAxisPadding = height/2;
          let maxRight = this.rect!.width - width/2;
          let maxBottom = this.rect!.height - 30;
          return {
            left: Math.max(xAxisPadding, Math.min(maxRight, pos.xAxis)) + 40,
            top: maxBottom
          };
        }
      },
      axis: {
        x: {
          type: 'category',
          max: {
            fit: true,
          },
          tick: {
            autorotate: true,
          }
        },
        y: {
          min: 0,
          padding: 0,
          tick: {
            count: this.maxTicks,
            values: ticks[0]
          }
        },
        y2: {
          show: true,
          padding: 0,
          min: 0, max: 100,
          tick: {
            count: this.maxTicks,
            values: ticks[1]
          }
        }
      },
      grid: {
        show: false
      },
      legend: {

      },
      point: {
        r: 4
      },
      line: {
        
      },
      ...opt
    })
  }

  updateGraph(data: any) {
    super.updateGraph(data);
    let ticks = this.getTickValues();
    (this.chart as any).internal.config.axis_y_tick_values = ticks[0];
    (this.chart as any).internal.config.axis_y2_tick_values = ticks[1];
  }
}
