import { ChangeDetectionStrategy, Component, ElementRef, ViewChild } from '@angular/core';
import { BasicWidget } from '../BasicWidget';
import * as d3 from 'd3';
import { SliceDice } from 'src/app/middle/Slice&Dice';
import { FiltersStatesService } from 'src/app/filters/filters-states.service';

import bb, {bar} from 'billboard.js';


@Component({
  selector: 'app-histocolumn',
  templateUrl: './histocolumn.component.html',
  styleUrls: ['./histocolumn.component.css'],
  providers: [SliceDice],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HistoColumnComponent extends BasicWidget {
  @ViewChild('content', {read: ElementRef})
  private content!: ElementRef;

  constructor(protected ref: ElementRef, protected filtersService: FiltersStatesService, protected sliceDice: SliceDice) {
    super(ref, filtersService, sliceDice);
  }

  updateGraph(data: any[]) {
    //temporary code to print no data⚠️
    if ( !(data[0].length - 1) )
      return this.noData(this.content);
    /****************⚠️ ***************/

    d3.select(this.ref.nativeElement).selectAll('div > *').remove();      
    bb.generate({
      bindto: this.content.nativeElement,
      data: {
        x: "x",
        columns: data,
        type: bar(),
        groups: [data.slice(1).map(x => x[0])],
        order: null
      },
      tooltip: {
        grouped: false
      },
      axis: {
        x: {
          type: 'category'
        }
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
    }
    });
  }
}
