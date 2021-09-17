import { ChangeDetectionStrategy, Component, ElementRef, ViewChild } from '@angular/core';
import { BasicWidget } from '../BasicWidget';
import * as d3 from 'd3';
import { SliceDice } from 'src/app/middle/Slice&Dice';
import { FiltersStatesService } from 'src/app/filters/filters-states.service';

import bb, {pie} from 'billboard.js';

@Component({
  selector: 'app-simple-pie',
  templateUrl: './simple-pie.component.html',
  styleUrls: ['./simple-pie.component.css'],
  providers: [SliceDice],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class SimplePieComponent extends BasicWidget {
  @ViewChild('content', {read: ElementRef})
  private content!: ElementRef;

  constructor(protected ref: ElementRef, protected filtersService: FiltersStatesService, protected sliceDice: SliceDice) {
    super(ref, filtersService, sliceDice);
  }

  updateGraph(data: any[]) {
    let sum = data.reduce((acc, d) => acc + d[1], 0);
    
    d3.select(this.ref.nativeElement).selectAll('div > *').remove();      
    bb.generate({
      bindto: this.content.nativeElement,
      data: {
        columns: data,
        type: pie(),
      },
      tooltip: {
        contents(d, defaultTitleFormat, defaultValueFormat, color) {
          let data = d[0];
          return `
            <div class="tooltip">
              ${data.id}: ${BasicWidget.format(sum * data.ratio, 3)}
              <div class="tooltip-tail"></div>
            </div>
          `;
        }
      },
      //disable clicks on legend
      legend: {
        item: {
          onclick() {}
        }
      }
    });
  }
}
