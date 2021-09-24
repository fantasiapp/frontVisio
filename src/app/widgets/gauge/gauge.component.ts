import { ChangeDetectionStrategy, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FiltersStatesService } from 'src/app/filters/filters-states.service';
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

  private padding: number = 15;
  
  constructor(ref: ElementRef, filtersService: FiltersStatesService, sliceDice: SliceDice) {
    super(ref, filtersService, sliceDice);
  }

  createGraph({data}: any, opt: {} = {}) {
    d3.select(this.ref.nativeElement).selectAll('div:nth-of-type(2) > *').remove();      
    this.chart = bb.generate({
      bindto: this.content.nativeElement,
      padding: { //makes the chart smaller
        left: this.padding, top: this.padding, bottom: this.padding, right: this.padding
      },
      data: {
        columns: [['Généralistes', Math.floor(100*Math.random())]],
        type: gauge(),
      },
      gauge: {
        label: {
          extents(value, isMax) {
            return "";
          },
        }
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
      color: {
        pattern: [
          '#D00000',
          '#FED137',
          '#4AA763'
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

  updateGraph(data: any[]) {
    let names = ['Généralistes', 'Multi Spécialistes', 'Purs Spécialistes', 'Autres'];
    this.schedule.queue(() => {
      let newIds = [names[4*Math.random() | 0]];
      let oldIds = this.chart!.data().map((d: any) => d.id);
      this.chart?.load({
        columns: [[newIds[0], Math.random()*100 | 0]],
        unload: oldIds.filter(x => !newIds.includes(x)),
        done: () => {
          this.schedule.emit();
        }
      });
    });
  }

}
