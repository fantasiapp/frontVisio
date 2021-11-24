import { ChangeDetectionStrategy, Component, ElementRef, Injector, ViewChild } from '@angular/core';
import { BasicWidget } from '../BasicWidget';
import * as d3 from 'd3';
import { SliceDice } from 'src/app/middle/Slice&Dice';
import { FiltersStatesService } from 'src/app/services/filters-states.service';

import bb, {bar, Chart, DataItem} from 'billboard.js';
import { Utils } from 'src/app/interfaces/Common';

@Component({
  selector: 'app-histocolumn',
  templateUrl: '../widget-template.html',
  styleUrls: ['./histocolumn.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HistoColumnComponent extends BasicWidget {
  @ViewChild('content', {read: ElementRef})
  protected content!: ElementRef;

  public axisLabelLength: number = 15;

  constructor(protected injector: Injector) {
    super(injector);
  }

  protected rect?: DOMRect;
  protected maxValue: any = 0;

  protected computeMax(data: any): any {
    let max = 0;
    for ( let i = 1; i < data[0].length; i++ ) {
      let acc = 0;
      for ( let j = 1; j < data.length; j++ )
        acc += data[j][i];
      
      if ( acc > max )
        max = acc;
    }
    return Math.round(max);
  }

  protected maxTicks = 6;
  protected getTickValues(max: any = this.maxValue): any {
    let t = this.maxTicks - 1,
      exp = Math.round(Math.log(max) / Math.log(10))-1,
      b = Math.pow(10, exp),
      goodValue = Math.ceil(max / (t*b)) * t*b,
      ticks = (new Array(t+1)).fill(0).map((_, i) => goodValue * i / t).filter(x => x <= max);
    
    if ( (max - ticks[ticks.length - 1])/max >= 0.1 )
      ticks.push(Math.round(max*10) / 10);
    return ticks;
  }

  createGraph({data, colors}: any, opt: {} = {}) {
    //temporary code to print no data⚠️
    if ( !(data.length - 1) || !(data[0].length - 1) )
      return this.noData(this.content);
    /****************⚠️ ***************/
    if ( data[0][0] != 'x' )
      console.log('[HistoRowComponent]: Rendering inaccurate format because `x` axis is unspecified.')
    

    let self = this;
    this.maxValue = this.computeMax(data);
    d3.select(this.ref.nativeElement).selectAll('div:nth-of-type(2) > *').remove();      
    let blueprint = {
      bindto: this.content.nativeElement,
      data: {
        x: data[0][0] == 'x' ? 'x' : undefined, /* ⚠️⚠️ inaccurate format ⚠️⚠️ */
        columns: data,
        type: bar(),
        groups: [data.slice(1).map((x: any[]) => x[0])],
        order: null,
        onclick(item: DataItem) {
          self.toggleTooltipOnClick(item);
        }
      },
      tooltip: {
        show: false
      },
      bar: {
        sensitivity: 10,
        width: {
          ratio: 0.3
        }
      },
      color: {
        pattern: colors
      },
      axis: {
        x: {
          type: 'category',
          max: {
            fit: true,
          },
          tick: {
            autorotate: true,
            format(this: Chart, index: number, category: string) {
              if ( index < this.categories().length )
                return category.length >= self.axisLabelLength+3 ? category.slice(0, self.axisLabelLength - 3) + '...' : category;
              return '';
            },
            multiline: true,
            tooltip: true
          }
        },
        y: {
          tick: {
            count: this.maxTicks,
            values: this.getTickValues()
          }
        }
      },
      grid: {
        y: {
          show: true,
          ticks: this.maxTicks
        }
      },
      //disable clicks on legend
      legend: {
        item: {
          onclick() {}
        },
      },
      onrendered(this: Chart) {
        let rect = (this.$.main.select('.bb-chart').node() as Element).getBoundingClientRect();
        self.rect = rect;
      },
      transition: {
        duration: 250
      },
      onresized() {
        self.clearTooltips();
      }
    };

    this.chart = bb.generate(Utils.dictDeepMerge(blueprint, opt));
  }

  updateGraph({data}: any) {
    if ( data[0][0] != 'x' ) {
      console.log('[HistoColumn]: Rendering inaccurate format because `x` axis is unspecified.')
      data = [['x', ...data.map((d: any[]) => d[0])], ...data];
    };

    let currentItems = Object.keys(this.chart!.xs()),
      newItems = data.slice(1).map((d: any[]) => d[0]),
      newCategories = data[0].slice(1);
    
    this.maxValue = this.computeMax(data);
    (this.chart as any).internal.config.axis_y_tick_values = this.getTickValues();
    this.schedule.queue(() => {
      this.chart!.load({
        columns: data,
        categories: newCategories,
        unload: currentItems.filter(x => !newItems.includes(x)),
        done: () => {
          this.schedule.next();
        }
      });
    });
  }   
}
