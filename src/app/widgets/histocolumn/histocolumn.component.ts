import { ChangeDetectionStrategy, Component, ElementRef, ViewChild } from '@angular/core';
import { BasicWidget } from '../BasicWidget';
import * as d3 from 'd3';
import { SliceDice } from 'src/app/middle/Slice&Dice';
import { FiltersStatesService } from 'src/app/filters/filters-states.service';

import bb, {bar} from 'billboard.js';
import { SequentialSchedule } from '../Schedule';


@Component({
  selector: 'app-histocolumn',
  templateUrl: './histocolumn.component.html',
  styleUrls: ['./histocolumn.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HistoColumnComponent extends BasicWidget {
  @ViewChild('content', {read: ElementRef})
  private content!: ElementRef;

  private schedule: SequentialSchedule = new SequentialSchedule;

  constructor(protected ref: ElementRef, protected filtersService: FiltersStatesService, protected sliceDice: SliceDice) {
    super(ref, filtersService, sliceDice);
  }

  createGraph(data: any[]) {
    //temporary code to print no data⚠️
    if ( !(data.length - 1) || !(data[0].length - 1) )
      return this.noData(this.content);
    /****************⚠️ ***************/
    if ( data[0][0] != 'x' )
      console.log('[HistoRowComponent]: Rendering inaccurate format because `x` axis is unspecified.')
    
    d3.select(this.ref.nativeElement).selectAll('div > *').remove();      
    this.chart = bb.generate({
      bindto: this.content.nativeElement,
      data: {
        x: data[0][0] == 'x' ? 'x' : undefined, /* ⚠️⚠️ inaccurate format ⚠️⚠️ */
        columns: data,
        type: bar(),
        groups: [data.slice(1).map(x => x[0])],
        order: null
      },
      tooltip: {
        grouped: false,
        contents: (d, defaultTitleFormat, defaultValueFormat, color) => {
          const data = d[0];
          return `
            <div class="tooltip">
              <span style="color:${color(data)}">${data.id}: </span>${BasicWidget.format(data.value, 3)} ${this.properties.unit}
              <div class="tooltip-tail"></div>
            </div>
          `;
        }
      },
      axis: {
        x: {
          type: 'category'
        }
      },
      grid: {
        y: {
          show: true
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
      }
    });
  }

  //wait on delays
  updateGraph(data: any[]) {
    this.schedule.queue(() => {
      this.chart!.categories(data[0].slice(1));
      this.chart!.load({
        columns: data,
        unload: true,
        done: () => {
          this.schedule.emit();
        }
      })
    });
  }   
}
