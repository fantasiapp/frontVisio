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

      d3.select(this.ref.nativeElement).selectAll('div:nth-of-type(2) > *').remove();      
      this.chart = bb.generate({
      bindto: this.content.nativeElement,
      padding: {
        left: 120
      },
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
          return `
            <div class="historow-tooltip tooltip">
              ${d.map((data: any) => `
                <span style="color:${color(data)}">${data.id}: </span>${BasicWidget.format(data.value, 3)} ${this.properties.unit}
              `).join('<br/>')}
              <div class="tooltip-tail"></div>
            </div>
          `;
        }
      },
      bar: {
        sensitivity: 10
      },
      axis: {
        x: {
          type: 'category',
          max: {
            fit: true
          }
        },
        rotated: true
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
      let currentCategories = this.chart!.categories();
      this.chart!.categories(data[0].slice(1));
      this.chart!.load({
        columns: data,
        unload: currentCategories,
        done: () => {
          this.schedule.emit();
        }
      });
    });
  } 

  updateData(): any[] {
    this.chart?.tooltip.hide();

    let args: any[] = this.properties.arguments;
    let data = this.sliceDice.getWidgetData(this.path, args[0], args[1], args[2], args[3], args[4], args[5], true);
    // ⚠️⚠️⚠️ find how to trigger change detection -- this works but doesn't use angular capabilities
    if ( this.dynamicDescription || this.properties.description == '@sum' ) {
      this.dynamicDescription = true;
      this.properties.description = BasicWidget.format(data.sum, 3) + ' ' + this.properties.unit;
      d3.select(this.ref.nativeElement).select('div:nth-of-type(1) p').text(this.properties.description);
    }
    return data.data;
  }
}
