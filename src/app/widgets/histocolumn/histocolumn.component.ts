import { ChangeDetectionStrategy, Component, ElementRef, ViewChild } from '@angular/core';
import { BasicWidget } from '../BasicWidget';
import * as d3 from 'd3';
import { SliceDice } from 'src/app/middle/Slice&Dice';
import { FiltersStatesService } from 'src/app/filters/filters-states.service';

import bb, {bar} from 'billboard.js';

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

  constructor(protected ref: ElementRef, protected filtersService: FiltersStatesService, protected sliceDice: SliceDice) {
    super(ref, filtersService, sliceDice);
  }

  protected rectHeight: number = 0;
  private maxValue: number = 0;

  private computeMax(data: any) {
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

  private getTickValues() {
    let power = Math.floor(Math.log10(this.maxValue)),
      exp = Math.pow(10, power),
      leadingCoefficient = Math.ceil(this.maxValue / exp),
      goodValue = leadingCoefficient * exp; //1 -> 9
    
    let ticks = [0, goodValue / 5, goodValue * 2/5, goodValue * 3/5, goodValue * 4/5, goodValue].filter(x => x <= this.maxValue);
    if ( (this.maxValue - ticks[ticks.length - 1])/this.maxValue >= 0.1 )
      ticks.push(this.maxValue);
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
    this.chart = (window as any).chart = bb.generate({
      bindto: this.content.nativeElement,
      data: {
        x: data[0][0] == 'x' ? 'x' : undefined, /* ⚠️⚠️ inaccurate format ⚠️⚠️ */
        columns: data,
        type: bar(),
        groups: [data.slice(1).map((x: any[]) => x[0])],
        order: null
      },
      tooltip: {
        grouped: false,
        contents: (d, defaultTitleFormat, defaultValueFormat, color) => {
          return `
            <div class="histocolumn-tooltip tooltip">
              ${d.filter((data: any) => data.value > 0.5).map((data: any) => `
                <span style="color:${color(data)}">${data.id}: </span>${BasicWidget.format(data.value, 3)} ${this.properties.unit}
              `).join('<br/>')}
              <div class="tooltip-tail"></div>
            </div>
          `;
        }, //barely works
        position: (data, width, height, element, pos) => {
          let axisPadding = 0;
          let maxBottom = this.rectHeight - 30; //30 css padding
          return {
            top: Math.max(axisPadding, Math.min(maxBottom, pos.y - height/2 + axisPadding)),
            left: (pos.xAxis || pos.x) + 20
          };
        }
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
            format(index: number, category: string) {
              console.log(category.length, self.axisLabelLength+3, category.slice(0, self.axisLabelLength - 3) +  '...',  category);
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
            count: 6,
            values: this.getTickValues()
          }
        }
      },
      grid: {
        y: {
          show: true,
          ticks: 6
        }
      },
      //disable clicks on legend
      legend: {
        item: {
          onclick() {}
        },
      },
      onrendered() {
        let rect = (this.$.main.select('.bb-chart').node() as Element).getBoundingClientRect();
        self.rectHeight = rect.height;
      },
      transition: {
        duration: 250
      },
      ...opt
    });
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
