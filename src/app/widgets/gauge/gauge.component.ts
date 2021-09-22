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

  createGraph(data: any[]) {
    d3.select(this.ref.nativeElement).selectAll('div:nth-of-type(2) > *').remove();      
    this.chart = bb.generate({
      bindto: this.content.nativeElement,
      padding: { //makes the chart smaller
        left: this.padding, top: this.padding, bottom: this.padding, right: this.padding
      },
      data: {
        columns: [['x', 10]],
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
        item: {
          onclick() {}
        }
      },
      transition: {
        duration: 250
      }
    });
    
  }

  updateGraph(data: any) {
    let names = ['Généralistes', 'Multi Spécialistes', 'Purs Spécialistes', 'Autres'];
    this.chart?.load({
      columns: [[names[(Math.random()*4) | 0], (Math.random()*100) | 0]],
    })
  }

}
