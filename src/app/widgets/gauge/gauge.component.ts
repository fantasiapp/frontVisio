import { ChangeDetectionStrategy, Component, ElementRef, Injector, OnInit, ViewChild } from '@angular/core';
import { SliceDice } from 'src/app/middle/Slice&Dice';
import { BasicWidget } from '../BasicWidget';
import bb, {DataItem, gauge} from 'billboard.js';
import * as d3 from 'd3';
import { Utils } from 'src/app/interfaces/Common';

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
  
  constructor(protected injector: Injector) {
    super(injector);
  }

  protected checkData(data: any) {
    return false;
  }

  setDetails(details: string) {
    d3.select(this.ref.nativeElement).select('.details').text(details);
  }

  createGraph({data, threshold}: any, opt: any = {}) {
    d3.select(this.ref.nativeElement).selectAll('div:nth-of-type(2) > *').remove();
    this.setDetails(data[0][0]);
    let self = this;
    let blueprint = {
      bindto: this.content.nativeElement,
      padding: { //makes the chart smaller
        left: this.padding, top: this.padding, bottom: this.padding, right: this.padding
      },
      data: {
        columns: data,
        type: gauge(),
        order: null,
        onclick(item: DataItem) {
          self.toggleTooltipOnClick(item);
        }
      },
      gauge: {
        label: {
          extents() {
            return "";
          },
        }
      },
      tooltip: {
        show: false
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
      onresized() {
        self.clearTooltips();
      }
    };
    this.chart = bb.generate(Utils.dictDeepMerge(blueprint, opt));
  }

  updateGraph({data}: any) {
    this.schedule.queue(() => {
      this.setDetails(data[0][0]);
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
