import { ChangeDetectionStrategy, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FiltersStatesService } from 'src/app/filters/filters-states.service';
import { SliceDice } from 'src/app/middle/Slice&Dice';
import { BasicWidget } from '../BasicWidget';
import bb, {gauge} from 'billboard.js';


//Huge rework
@Component({
  selector: 'app-gauge',
  templateUrl: './gauge.component.html',
  styleUrls: ['./gauge.component.css'],
  providers: [SliceDice],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GaugeComponent extends BasicWidget {
  @ViewChild('content', {read: ElementRef})
  private content!: ElementRef;
  
  constructor(ref: ElementRef, filtersService: FiltersStatesService, sliceDice: SliceDice) {
    super(ref, filtersService, sliceDice);
  }

  createGraph(data: any[]) {
    this.chart = bb.generate({
      bindto: this.content.nativeElement,
      data: {
        columns: data.slice(0, 1),
        type: gauge(),
      },
      gauge: {
        title: "Hello",
        label: {
          extents(value, isMax) {
            return "";
          },
        }
      },
      tooltip: {
        show: false
      },
      color: {
        pattern: [
          '#4AA763',
          '#FED137',
          '#D00000'
        ],
        threshold: {
          values: [
            33,
            66,
            100
          ]
        }
      },
      legend: {
        show: false
      },
      transition: {
        duration: 250,
      }
    });

    // to set the new title without api
    this.chart.$.main.select(".bb-chart-arcs-title").text("my new title");
    //--------------------
    this.chart.config('donut.title', 'title', true);
    //this.chart.setArcTitle()
  }

}
