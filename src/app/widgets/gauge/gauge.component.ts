import { ChangeDetectionStrategy, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FiltersStatesService } from 'src/app/services/filters-states.service';
import { SliceDice } from 'src/app/middle/Slice&Dice';
import { BasicWidget } from '../BasicWidget';
import bb, {gauge} from 'billboard.js';
import * as d3 from 'd3';

//unmock & present
@Component({
  selector: 'app-gauge',
  templateUrl: './gauge.component.html',
  styleUrls: ['./gauge.component.css'],
  providers: [SliceDice],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GaugeComponent extends BasicWidget {
  @ViewChild('content', {read: ElementRef})
  protected content!: ElementRef;

  private padding: number = 10;
  
  constructor(ref: ElementRef, filtersService: FiltersStatesService, sliceDice: SliceDice) {
    super(ref, filtersService, sliceDice);
  }

  protected checkData(data: any) {
    return false;
  }

  createGraph({data, threshold}: any, opt: {} = {}) {
    d3.select(this.ref.nativeElement).selectAll('div:nth-of-type(2) > *').remove();      
    this.chart = bb.generate({
      bindto: this.content.nativeElement,
      padding: { //makes the chart smaller
        left: this.padding, top: this.padding, bottom: this.padding, right: this.padding
      },
      data: {
        columns: data,
        type: gauge(),
        order: null
      },
      gauge: {
        label: {
          extents(value, isMax) {
            return "";
          },
        }
      },
      tooltip: {
        grouped: false,
        contents: (d, defaultTitleFormat, defaultValueFormat, color) => {
          const data = d[0];
          return `
            <div class="tooltip">
              Résultat: <span style="color:${color(data)}">${BasicWidget.format(data.value, 3)} %</span>
              <div class="tooltip-tail"></div>
            </div>
          `;
        },
      },
      color: {
        pattern: [
          '#D00000',
          '#FED137',
          '#4AA763'
        ],
        threshold: {
          values: threshold
        }
      },
      legend: {
        show: false
      },
      transition: {
        duration: 250
      },
      ...opt
    });
    d3.select(this.ref.nativeElement).select('.title').text(data[0][0]);
  }

  updateGraph({data}: any) {
    this.schedule.queue(() => {
      d3.select(this.ref.nativeElement).select('.title').text(data[0][0]);
      let newId = data;
      let oldId = this.chart!.data()[0].id;
      this.chart?.load({
        columns: data,
        unload: newId == oldId ? false : [oldId],
        done: () => {
          this.schedule.next();
        }
      });
    });
  }

}
