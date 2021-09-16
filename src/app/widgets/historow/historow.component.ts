import { ChangeDetectionStrategy, Component, ElementRef, ViewChild } from '@angular/core';
import { BasicWidget } from '../BasicWidget';
import * as d3 from 'd3';
import { SliceDice } from 'src/app/middle/Slice&Dice';
import { FiltersStatesService } from 'src/app/filters/filters-states.service';

import bb, {bar} from 'billboard.js';


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

  updateGraph(data: any[]) {
    d3.select(this.ref.nativeElement).selectAll('div > *').remove();      
    bb.generate({
      bindto: this.content.nativeElement,
      data: {
        x: "x",
        columns: [
          ["x", "2013-01-01", "2013-01-02", "2013-01-03", "2013-01-04", "2013-01-05", "2013-01-06"],
          ["data1", 20, 50, 100, 50, 50, 50],
          ["data2", 50, 90, 110, 80, 22, 74],
          ["data3", 100, 20, 90, 70, 52, 44],
          ["data4", 90, 50, 70, 55, 75, 65],
        ],
        type: bar(),
        groups: [
          ["data1", "data2", "data3", "data4"],
        ]
      },
      axis: {
        x: {
          type: "timeseries"
        },
        rotated: true
      }
    });
  }
}
