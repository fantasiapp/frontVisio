import { ChangeDetectionStrategy, Component, ElementRef, ViewChild } from '@angular/core';
import { BasicWidget } from '../BasicWidget';
import * as d3 from 'd3';
import { SliceDice } from 'src/app/middle/Slice&Dice';
import { FiltersStatesService } from 'src/app/filters/filters-states.service';

import bb, {donut} from 'billboard.js';

@Component({
  selector: 'app-simple-donut',
  templateUrl: './simple-donut.component.html',
  styleUrls: ['./simple-donut.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SimpleDonutComponent extends BasicWidget {
  @ViewChild('content', {read: ElementRef})
  protected content!: ElementRef;

  constructor(protected ref: ElementRef, protected filtersService: FiltersStatesService, protected sliceDice: SliceDice) {
    super(ref, filtersService, sliceDice);
  }

  createGraph({data}: any, opt: {} = {}) {
    let sum = data.reduce((acc: number, d: any[]) => acc + d[1], 0);
    //temporary code to print no data⚠️
    if ( !data.length || !sum )
      return this.noData(this.content);
    /****************⚠️ ***************/
    
    d3.select(this.ref.nativeElement).selectAll('div:nth-of-type(2) > *').remove();      
    this.chart = bb.generate({
      bindto: this.content.nativeElement,
      data: {
        columns: data,
        type: donut()
      },
      tooltip: {
        contents: (d, defaultTitleFormat, defaultValueFormat, color) => {
          const data = d[0];
          return `
            <div class="tooltip">
              <span style="color:${color(data)}">${data.id}: </span>${BasicWidget.format(data.value, 3)} ${this.properties.unit}
              <div class="tooltip-tail"></div>
            </div>
          `;
        },
      },
      //remove labels on slices
      donut: {
        label: {format(v: number, ratio: number, id: string) { return '' }}
      },
      //disable clicks on legend
      legend: {
        item: {
          onclick() {},
          tile: {height: this.tileHeight}
        },
        position: 'inset',
        inset: {
          anchor: 'bottom-right',
          y: 5 + (data.length) * this.tileHeight
        }
      },
      transition: {
        duration: 250
      },
      ...opt
    });
  }
}
