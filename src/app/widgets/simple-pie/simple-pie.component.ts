import { ChangeDetectionStrategy, Component, ElementRef, Injector, ViewChild } from '@angular/core';
import { BasicWidget } from '../BasicWidget';
import * as d3 from 'd3';
import bb, {DataItem, pie} from 'billboard.js';
import { Utils } from 'src/app/interfaces/Common';

@Component({
  selector: 'app-simple-pie',
  templateUrl: '../widget-template.html',
  styleUrls: ['./simple-pie.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class SimplePieComponent extends BasicWidget {
  constructor(protected injector: Injector) {
    super(injector);    
  }
  

  createGraph({data, colors}: {data: any[], colors: string[]}, opt: {} = {}) {
    d3.select(this.ref.nativeElement).selectAll('div:nth-of-type(2) > *').remove();
    let self = this;
    let blueprint = {
      bindto: this.content.nativeElement,
      data: {
        columns: data,
        type: pie(),
        order: null,
        onclick(item: DataItem) {
          self.toggleTooltipOnClick(item);
        }
      },
      tooltip: {
        show: false
      },
      //remove labels on slices
      pie: {
        label: {format(v: number, ratio: number, id: string) { return ''; }},
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
          onclick(id: string) {  },
          tile: { }
        },
        position: 'inset',
        inset: {
          anchor: 'bottom-left',
          y: 20 + (data.length - 0.5) * BasicWidget.legendItemHeight,
          x: 10
        }
      },
      transition: {
        duration: 250
      },
      onrendered: () => {
        //initial rendering bug
        this.chart!.config('onrendered', null);
        this.chart!.config('legend_item_tile_height', BasicWidget.legendItemHeight);
        this.chart!.config('legend_inset_y', 20 + (data.length - 0.5) * BasicWidget.legendItemHeight);
      },
      onresized: () => {
        this.chart!.config('legend_item_tile_height', BasicWidget.legendItemHeight);
        this.chart!.config('legend_inset_y', 20 + (this.chart!.data().length - 0.5) * BasicWidget.legendItemHeight);
        this.clearTooltips();
      }
    };

    this.chart = bb.generate(Utils.dictDeepMerge(blueprint, opt));
  }
};