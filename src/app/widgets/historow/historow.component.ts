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
    for ( let i = 1; i < data.length; i++ )
      data[i].push(1);
    
    let d = new Array(data[0].length);
    
    for ( let i = 0; i < data[0].length; i++ ) {
      d[i] = new Array(data.length);
      for ( let j = 0; j < data.length; j++ )
        d[i][j] = data[j][i];
    }

    d3.select(this.ref.nativeElement).selectAll('div > *').remove();      
    bb.generate({
      bindto: this.content.nativeElement,
      data: {
        x: "x",
        columns: d,
        type: bar(),
        groups: [d.slice(1).map(x => x[0])]
      },
      tooltip: {
        grouped: false
      },
      axis: {
        x: {
          type: 'category'
        },
        rotated: true
      }
    });
  }
}
