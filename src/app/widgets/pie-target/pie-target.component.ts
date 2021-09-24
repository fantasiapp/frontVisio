import { Component, ElementRef, ViewChild } from '@angular/core';
import { Chart, d3Selection, pie } from 'billboard.js';
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
    this.properties.target = 0;
  }

  createGraph(data: any) {
    let self = this;
    super.createGraph(data, {
      data: {
        columns: data.data, //extract the actual data
        type: pie(),
        onover: () => {
          //check if needle is over the slice 
          let rads = (this.needleRotate) * Math.PI / 180;
          this.getNeedleGroup()
            .style('transform', `translate(${this.needleTranslate[0]}px, ${this.needleTranslate[1]}px) scale(1.03)`);
        },
        onout: () => {
          this.getNeedleGroup()
            .style('transform', `translate(${this.needleTranslate[0]}px, ${this.needleTranslate[1]}px) scale(1)`);
        }
      },
      onresized: () => {
        this.createNeedle(null)
      },
      onrendered(this: Chart) {
        self.createNeedle(data);
        this.config('onrendered', null);
      }
    });
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
      .style('transform', `rotate(${this.needleRotate }deg)`)
      .attr('x1', 0)
      .attr('y1', 2 - radius)
      .attr('x2', 0)
      .attr('y2', 0);
  }

  // 🛑 this is the mission of the middle 🛑
  computeNeedlePosition(data: any): number {
    return data.target;
  }

  updateGraph(data: any[]) {
    super.updateGraph(data);
    this.updateNeedle(data);
  }

  private getNeedleGroup() {
    return d3.select(this.needle?.node().parentNode);
  }
}
