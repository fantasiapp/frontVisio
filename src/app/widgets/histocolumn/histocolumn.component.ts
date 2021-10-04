import { ChangeDetectionStrategy, Component, ElementRef, ViewChild } from '@angular/core';
import { BasicWidget } from '../BasicWidget';
import * as d3 from 'd3';
import { SliceDice } from 'src/app/middle/Slice&Dice';
import { FiltersStatesService } from 'src/app/filters/filters-states.service';

import bb, {bar} from 'billboard.js';
import { SequentialSchedule } from '../Schedule';


@Component({
  selector: 'app-histocolumn',
  templateUrl: '../widget-template.html',
  styleUrls: ['./histocolumn.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HistoColumnComponent extends BasicWidget {
  @ViewChild('content', {read: ElementRef})
  protected content!: ElementRef;

  constructor(protected ref: ElementRef, protected filtersService: FiltersStatesService, protected sliceDice: SliceDice) {
    super(ref, filtersService, sliceDice);
  }

  createGraph({data, colors}: any, opt: {} = {}) {
    //temporary code to print no data⚠️
    if ( !(data.length - 1) || !(data[0].length - 1) )
      return this.noData(this.content);
    /****************⚠️ ***************/
    if ( data[0][0] != 'x' )
      console.log('[HistoRowComponent]: Rendering inaccurate format because `x` axis is unspecified.')
    
    d3.select(this.ref.nativeElement).selectAll('div:nth-of-type(2) > *').remove();      
    this.chart = bb.generate({
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
              ${d.map((data: any) => `
                <span style="color:${color(data)}">${data.id}: </span>${BasicWidget.format(data.value, 3)} ${this.properties.unit}
              `).join('<br/>')}
              <div class="tooltip-tail"></div>
            </div>
          `;
        }
      },
      bar: {
        sensitivity: 10,
        width: {
          ratio: 0.5
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
              if ( index < this.categories().length )
                return category;
              return '';
            }
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
    this.schedule.queue(() => {
      this.chart!.load({
        columns: data.slice(1),
        categories: newCategories,
        unload: currentItems.filter(x => !newItems.includes(x)),
        done: () => {
          this.schedule.next();
        }
      });
    });
  }   
}
