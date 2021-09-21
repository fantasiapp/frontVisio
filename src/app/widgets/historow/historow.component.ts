import { ChangeDetectionStrategy, Component, ElementRef, ViewChild } from '@angular/core';
import { BasicWidget } from '../BasicWidget';
import * as d3 from 'd3';
import { SliceDice } from 'src/app/middle/Slice&Dice';
import { FiltersStatesService } from 'src/app/filters/filters-states.service';
import { SequentialSchedule } from '../Schedule';
import bb, {bar, Chart} from 'billboard.js';


@Component({
  selector: 'app-historow',
  templateUrl: './historow.component.html',
  styleUrls: ['./historow.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HistoRowComponent extends BasicWidget {
  @ViewChild('content', {read: ElementRef})
  private content!: ElementRef;

  //schedule animations
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
      console.log('[HistoColumnComponent]: Rendering inaccurate format because `x` axis is unspecified.')

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
            <div class="historow-tooltip tooltip">
              <span style="color:${color(data)}">${data.id}: </span>${BasicWidget.format(data.value, 3)} ${this.properties.unit}
              <div class="tooltip-tail"></div>
            </div>
          `;
        }
      },
      bar: {
        sensitivity: 10,
      },
      axis: {
        x: {
          type: 'category',
        },
        rotated: true
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
        }
      },
      transition: {
        duration: 250
      }
    });
  }

  //wait on delays
  updateGraph(data: any[]) {
    this.schedule.queue(() => {
      console.log(data);
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

  updateData(): any[] {
    let args: any[] = this.properties.arguments;
    let data = this.sliceDice.getWidgetData(this.path, args[0], args[1], args[2], args[3], args[4], args[5], true);

    // ⚠️⚠️⚠️ find how to trigger change detection -- this works but doesn't use angular capabilities
    if ( this.properties.description == '@sum' ) {
      this.properties.description = BasicWidget.format(data.sum) + ' ' + this.properties.unit;
      d3.select(this.ref.nativeElement).select('p').text(this.properties.description);
    }
    
    return data.data;
  }
}
