import { ChangeDetectionStrategy, Component, ElementRef, ViewChild } from '@angular/core';
import {bar, bb, line} from 'billboard.js';
import * as d3 from 'd3';
import { FiltersStatesService } from 'src/app/filters/filters-states.service';
import { SliceDice } from 'src/app/middle/Slice&Dice';
import { BasicWidget } from '../BasicWidget';

@Component({
  selector: 'app-histocurve',
  templateUrl: '../widget-template.html',
  styleUrls: ['./histocurve.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HistocurveComponent extends BasicWidget {
  @ViewChild('content', {read: ElementRef})
  protected content!: ElementRef;
  
  constructor(protected ref: ElementRef, protected filtersService: FiltersStatesService, protected sliceDice: SliceDice) {
    super(ref, filtersService, sliceDice);
  }

  updateGraph({data}: any) {
    let n = 4 + (Math.random()*6 | 0);
    let d = [
      ['$1', ...(new Array(n).fill(0).map(_ => Math.random()))],
      ['$2', ...(new Array(n).fill(0).map(_ => Math.random()))]
    ];

    this.schedule.queue(() => {
      this.chart!.load({
        columns: d,
        done: () => {
          this.schedule.next();
        }
      });
    });
  }

  createGraph({data, colors}: any, opt: {} = {}) {
    let n = 4 + (Math.random()*6 | 0);
    let alpha = new Array(26).fill(0).map((_, i) => String.fromCharCode(97 + i));
    d3.select(this.ref.nativeElement).selectAll('div:nth-of-type(2) > *').remove();      
    this.chart = bb.generate({
      bindto: this.content.nativeElement,
      data: {
        x: 'x',
        columns: [
          ['x', ...(alpha.slice(0, n))],
          ['$1', ...(new Array(n).fill(0).map(_ => 10*Math.random() + 1))],
          ['$2', ...(new Array(n).fill(0).map(_ => 10*Math.random() + 1))]
        ],
        types: {
          '$1': bar(),
          '$2': line()
        },
        order: null
      },
      point: {
        r: 4
      },
      line: {
        
      },
      tooltip: {
        contents: (d, defaultTitleFormat, defaultValueFormat, color) => {
          return `
            <div class="tooltip">
              <span style="color:${color(d[0])}">${d[0].id}: </span>${BasicWidget.format(d[0].value, 3)} ${this.properties.unit}
              <br/>
              <span style="color:${color(d[1])}">${d[1].id}: </span>${BasicWidget.format(d[1].value, 3)} ${this.properties.unit}
              <div class="tooltip-tail"></div>
            </div>
          `;
        },
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
      legend: {
        item: {
          onclick() {}
        }
      },
      transition: {
        duration: 250
      },
      ...opt
    });
  }
}
