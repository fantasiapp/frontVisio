import { ChangeDetectionStrategy, Component, ElementRef, ViewChild } from '@angular/core';
import { BasicWidget } from '../BasicWidget';
import * as d3 from 'd3';
import { SliceDice } from 'src/app/middle/Slice&Dice';
import { FiltersStatesService } from 'src/app/filters/filters-states.service';

import bb, {donut} from 'billboard.js';

@Component({
  selector: 'app-simple-donut',
  templateUrl: '../widget-template.html',
  styleUrls: ['./simple-donut.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SimpleDonutComponent extends BasicWidget {
  @ViewChild('content', {read: ElementRef})
  protected content!: ElementRef;

  constructor(protected ref: ElementRef, protected filtersService: FiltersStatesService, protected sliceDice: SliceDice) {
    super(ref, filtersService, sliceDice);
  }

  createGraph({data, colors}: any, opt: {} = {}) {
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
        type: donut(),
        order: null
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
        label: {format(v: number, ratio: number, id: string) { return '' }},
        expand: {
          duration: 50,
          rate: 0.99
        },
        startingAngle: Math.PI/2
      },
      color: {
        pattern: colors
      },
      //disable clicks on legend
      legend: {
        item: {
          onclick() {},
          tile: {height: BasicWidget.legendItemHeight}
        },
        position: 'inset',
        inset: {
          anchor: 'bottom-right',
          y: 10 + (data[0].length) * BasicWidget.legendItemHeight
        }
      },
      transition: {
        duration: 250
      },
      onrendered: () => {
        //initial rendering bug
        this.chart!.config('legend_item_tile_height', BasicWidget.legendItemHeight);
        this.chart!.config('legend_inset_y', 10 + this.chart!.data().length * BasicWidget.legendItemHeight);
        this.chart!.config('onrendered', null);
        this.chart!.flush();
      },
      onresized: () => {
        this.chart!.config('legend_item_tile_height', BasicWidget.legendItemHeight);
        this.chart!.config('legend_inset_y', 10 + (this.chart!.data().length) * BasicWidget.legendItemHeight);
        this.chart!.flush();
      },
      ...opt
    });
  }
}
