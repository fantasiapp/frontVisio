import { Component, ElementRef, ViewChild } from '@angular/core';
import { d3Selection } from 'billboard.js';
import * as d3 from 'd3';
import { FiltersStatesService } from 'src/app/filters/filters-states.service';
import { SliceDice } from 'src/app/middle/Slice&Dice';
import { SimplePieComponent } from '../simple-pie/simple-pie.component';

@Component({
  selector: 'app-pie-target',
  templateUrl: './pie-target.component.html',
  styleUrls: ['./pie-target.component.css']
})
export class PieTargetComponent extends SimplePieComponent {
  @ViewChild('content', {read: ElementRef})
  protected content!: ElementRef;

  private needle?: d3Selection;
  private needleTranslate: [number, number] = [0, 0];
  private needleRotate: number = 0;
//  private data?: any[]; //store data reference, use it to draw needle
  
  constructor(protected ref: ElementRef, protected filtersService: FiltersStatesService, protected sliceDice: SliceDice) {
    super(ref, filtersService, sliceDice);
  }

  createGraph(data: any[]) {
    //draw base curve
//    this.data = data;
    super.createGraph(data);
    this.chart!.config('onrendered', () => {
      this.createNeedle(data!);
      this.chart!.config('onrendered', null);
    });

    console.log((<any>window).chart = this.chart);
  }

  private updateNeedle(data: any[]) {
    if ( !this.needle )
      return this.createNeedle(data);
    
    //assumes box doesn't change in size
    this.needleRotate = this.computeNeedlePosition(data);
    this.needle!.style('transform', `translate(${this.needleTranslate[0]}px, ${this.needleTranslate[1]}px) rotate(${this.needleRotate}deg)`)
  }

  private createNeedle(data: any[]) {
    d3.select('.simple-needle').remove();

    let svg = this.chart!.$.svg, svgRect = svg.node().getBoundingClientRect();
    let main = this.chart!.$.main!;
    let rect = main.node().getBoundingClientRect();
    let radius = Math.min(rect.width, rect.height) / 2;
    this.needleTranslate = [svgRect.width / 2, svgRect.height / 2 - 2];
    this.needleRotate = this.computeNeedlePosition(data);
    
    this.needle = svg.append('g')
      .classed('simple-needle', true)
      .append('line')
      .style('transform', `translate(${this.needleTranslate[0]}px, ${this.needleTranslate[1]}px) rotate(${this.needleRotate}deg)`)
      .style('stroke', 'yellow')
      .style('stroke-width', 3)
      .style('stroke-linecap', 'round')
      .attr('x1', 0)
      .attr('y1', 0)
      .attr('x2', 0)
      .attr('y2', radius - 2);
  }

  // 🛑 this is the mission of the middle 🛑
  computeNeedlePosition(data: any[]) {
    //Data is ordered so that the greatest two elements come first
    console.log(data);
    let portion = data[0][1] + (data[1] ? data[1][1] : 0),
      ratio = portion / data.reduce((acc: number, d: any) => acc + d[1], 0);

    return 360*ratio - 180;
  }

  updateGraph(data: any[]) {
//    this.data = data;
    super.updateGraph(data);
    this.updateNeedle(data);
  }
}
