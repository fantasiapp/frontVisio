import { ChangeDetectionStrategy, Component, ElementRef, ViewChild } from '@angular/core';
import { Chart, d3Selection, pie } from 'billboard.js';
import * as d3 from 'd3';
import { FiltersStatesService } from 'src/app/filters/filters-states.service';
import { SliceDice } from 'src/app/middle/Slice&Dice';
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
  
  constructor(protected ref: ElementRef, protected filtersService: FiltersStatesService, protected sliceDice: SliceDice) {
    super(ref, filtersService, sliceDice);
  }

  createGraph(data: any) {
    let self = this;
    super.createGraph(data, {
      data: {
        columns: data.data, //extract the actual data
        type: pie(),
        onover: () => {
          this.getNeedleGroup()
            .style('transform', `translate(${this.needleTranslate[0]}px, ${this.needleTranslate[1]}px) scale(1.05)`);
        },
        onout: () => {
          this.getNeedleGroup()
            .style('transform', `translate(${this.needleTranslate[0]}px, ${this.needleTranslate[1]}px) scale(1)`);
        },
        order: null
      },
      onresized: () => {
        this.chart!.config('legend_item_tile_height', BasicWidget.legendItemHeight);
        this.chart!.config('legend_inset_y', 20 + this.chart!.data().length * BasicWidget.legendItemHeight);
        this.chart!.flush();
        requestAnimationFrame(_ => this.createNeedle({data: null, target: this.needleRotate - 90}))
      },
      onrendered(this: Chart) {
        self.chart!.config('legend_item_tile_height', BasicWidget.legendItemHeight);
        self.chart!.config('legend_inset_y', 20 + self.chart!.data().length * BasicWidget.legendItemHeight);
        self.createNeedle(data);
        self.chart!.flush();
        this.config('onrendered', null);
      }
    });
  }

  updateGraph(data: any[]) {
    super.updateGraph(data);
    this.updateNeedle(data);
  }

  getDataArguments(): [any, string, string, string, string[], string[], string, boolean, boolean] {
    let args: any[] = this.properties.arguments;
    return [this.node, args[0], args[1], args[2], args[3], args[4], args[5], false, true];
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
