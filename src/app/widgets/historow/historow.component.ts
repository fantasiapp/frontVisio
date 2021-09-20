import { ChangeDetectionStrategy, Component, ElementRef, ViewChild } from '@angular/core';
import { BasicWidget } from '../BasicWidget';
import * as d3 from 'd3';
import { SliceDice } from 'src/app/middle/Slice&Dice';
import { FiltersStatesService } from 'src/app/filters/filters-states.service';

import bb, {bar, Chart} from 'billboard.js';


@Component({
  selector: 'app-historow',
  templateUrl: './historow.component.html',
  styleUrls: ['./historow.component.css'],
  providers: [SliceDice],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HistoRowComponent extends BasicWidget {
  @ViewChild('content', {read: ElementRef})
  private content!: ElementRef;

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
        contents(data, defaultTitleFormat, defaultValueFormat, color) {
          return `
            <div class="tooltip historow-tooltip">
              ${data.map((d: any) => `<span style="color: ${color(d.id)}">${d.id}: </span>${BasicWidget.format(d.value, 3)}`).join('<br/>')}
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
        duration: 100
      }
    });
  }

  updateGraph(data: any[]) {
    this.chart!.load({
      columns: data.slice(1),
      unload: true
    })
  } 

  updateData(): any[] {
    let args: any[] = this.properties.arguments;
    let data = this.sliceDice.getWidgetData(this.path, args[0], args[1], args[2], args[3], args[4], args[5], true);
    console.log('[HistoRowComponent -- updateData]: Retrieving Data. Result:', data);
    return data;
  }
}
