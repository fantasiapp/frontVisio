import { ChangeDetectionStrategy, Component, ElementRef, Injector, ViewChild } from '@angular/core';
import {bar, DataItem, line} from 'billboard.js';
import { FiltersStatesService } from 'src/app/services/filters-states.service';
import { SliceDice } from 'src/app/middle/Slice&Dice';
import { BasicWidget } from '../BasicWidget';
import { HistoColumnComponent } from '../histocolumn/histocolumn.component';
import { Utils } from 'src/app/interfaces/Common';
import { TooltipItem } from '../tooltip/tooltip.component';

@Component({
  selector: 'app-histocurve',
  templateUrl: '../widget-template.html',
  styleUrls: ['./histocurve.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HistocurveComponent extends HistoColumnComponent {
  @ViewChild('content', {read: ElementRef})
  protected content!: ElementRef;
  
  constructor(protected injector: Injector) {
    super(injector);
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

  createGraph(d: any) {
    let {data} = d;

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
        show: false,
        grouped: true
      },
      axis: {
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
      point: {
        r: 4
      }
    })
  }

  protected makeTooltip(item: DataItem): TooltipItem {
    let data = this.chart!.data(),
      units = this.properties.unit.split('|'),
      percentIndex = units.indexOf('%'),
      unit = item == data[1].values[item.index!] ? units[percentIndex] : units[1 - percentIndex];

    return {
      color: this.chart!.color(item.id),
      id: item.id,
      body: `: ${Utils.format(item.value, 3, this.properties.unit.toLowerCase() == 'pdv')} ${unit}`
    }
  }

  updateGraph(data: any) {
    super.updateGraph(data);
    let ticks = this.getTickValues();
    (this.chart as any).internal.config.axis_y_tick_values = ticks[0];
    (this.chart as any).internal.config.axis_y2_tick_values = ticks[1];
  }
}
