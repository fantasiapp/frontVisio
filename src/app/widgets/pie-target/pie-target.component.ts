import { ChangeDetectionStrategy, Component, ElementRef, Injector, ViewChild } from '@angular/core';
import { Chart, d3Selection, DataItem, pie } from 'billboard.js';
import * as d3 from 'd3';
import { BasicWidget } from '../BasicWidget';
import { SimplePieComponent } from '../simple-pie/simple-pie.component';

@Component({
  selector: 'app-pie-target',
  templateUrl: '../widget-template.html',
  styleUrls: ['./pie-target.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PieTargetComponent extends SimplePieComponent {
  @ViewChild('content', {read: ElementRef})
  protected content!: ElementRef;

  private needle?: d3Selection;
  private needleTranslate: [number, number] = [0, 0];
  private needleRotate: number = 0;
  
  constructor(protected injector: Injector) {
    super(injector);
  }

  createGraph(data: any) {
    let self = this;
    super.createGraph(data, {
      data: {
        onover: () => {
          this.getNeedleGroup()
            .style('transform', `translate(${this.needleTranslate[0]}px, ${this.needleTranslate[1]}px) scale(1.05)`);
        },
        onout: () => {
          this.getNeedleGroup()
            .style('transform', `translate(${this.needleTranslate[0]}px, ${this.needleTranslate[1]}px) scale(1)`);
        }
      },
      onresized(this: Chart) {
        if ( !this ) return;
        //apparently this is sometimes an instance of ChartInternal (maybe a bug in billboard), so we'll use self.chart
        self.chart!.config('legend_item_tile_height', BasicWidget.legendItemHeight);
        self.chart!.config('legend_inset_y', 20 + self.chart!.data().length * BasicWidget.legendItemHeight);
        self.createNeedle({data: null, target: self.needleRotate - 90});
      },
      onrendered(this: Chart) {
        if ( !this ) return;
        this.config('onrendered', null);
        this.config('legend_item_tile_height', BasicWidget.legendItemHeight);
        this.config('legend_inset_y', 20 + data.data.length * BasicWidget.legendItemHeight);
        self.createNeedle(data);
      }
    });
  }

  updateGraph(data: any[]) {
    super.updateGraph(data);
    this.updateNeedle(data);
  }

  getDataArguments(): [string, string, string, string[], string[], string, boolean, boolean] {
    let args: any[] = this.properties.arguments;
    return [args[0], args[1], args[2], args[3], args[4], args[5], false, true];
  }

  private updateNeedle(data: any) {
    if ( !this.needle )
      return this.createNeedle(data);
    
    //assumes box doesn't change in size
    this.needleRotate = this.computeNeedlePosition(data);
    this.getNeedleGroup()!
      .style('transform', `translate(${this.needleTranslate[0]}px, ${this.needleTranslate[1]}px) `);
    this.needle!.style('transform', `rotate(${this.needleRotate}deg)`)
  }

  private createNeedle(data: any) {
    if ( this.needle )
      this.getNeedleGroup().remove();

    let svg = this.chart!.$.svg, svgRect = svg.node().getBoundingClientRect();
    let main = this.chart!.$.main!;
    let rect = main.node().getBoundingClientRect();
    let radius = Math.min(rect.width, rect.height) / 2;
    this.needleTranslate = [svgRect.width / 2, svgRect.height / 2 - 2];
    this.needleRotate = this.computeNeedlePosition(data);
    
    this.needle = svg.append('g')
      .classed('simple-needle', true)
      .style('transform', `translate(${this.needleTranslate[0]}px, ${this.needleTranslate[1]}px)`)
      .append('line')
      .style('transform', `rotate(${this.needleRotate}deg)`)
      .attr('x1', 0)
      .attr('y1', 2 - radius)
      .attr('x2', 0)
      .attr('y2', 0);
  }

  private computeNeedlePosition(data: any): number {
    return data.target + 90;
  }

  private getNeedleGroup() {
    return d3.select(this.needle?.node().parentNode);
  }
}
