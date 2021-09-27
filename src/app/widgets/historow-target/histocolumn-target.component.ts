import { Component, ElementRef, ViewChild } from '@angular/core';
import { Chart, d3Selection } from 'billboard.js';
import * as d3 from 'd3';
import { FiltersStatesService } from 'src/app/filters/filters-states.service';
import { SliceDice } from 'src/app/middle/Slice&Dice';
import { HistoColumnComponent } from '../histocolumn/histocolumn.component';

@Component({
  selector: 'app-historow-target',
  templateUrl: '../widget-template.html',
  styleUrls: ['./histocolumn-target.component.css']
})
export class HistoColumnTargetComponent extends HistoColumnComponent {
  @ViewChild('content', {read: ElementRef})
  protected content!: ElementRef;

  private transitionDuration = 250;
  private needles?: d3Selection;
  private barHeights: number[] = [];
  private barTargets: number[] = [];
  private offsetX: number = 0;
  private offsetY: number = 0;
  private marginX: number = 0;
  private barWidth: number = 0;
  
  constructor(protected ref: ElementRef, protected filtersService: FiltersStatesService, protected sliceDice: SliceDice) {
    super(ref, filtersService, sliceDice);
    
  }

  private createTargetControl() {    
    d3.select(this.ref.nativeElement)
      .insert('div', 'div.container')
      .classed('target-control', true);
  };

  private renderTargetControl() {
    let barsNumber = this.barHeights.length;
    console.log(this);

    console.log(d3.select(this.ref.nativeElement)
    .select('div.target-control'))

    d3.select(this.ref.nativeElement)
      .select('div.target-control')
      .style('margin-left', -5/4*this.marginX + 'px')
      .selectAll('input')
      .data(d3.range(barsNumber))
      .enter()
        .append('input')
        .classed('target-input', true)
        .style('width', (this.barWidth|0) + 'px')
        .style('margin', '10px ' + (this.offsetX|0) + 'px')
  }

  createGraph(data: any) {
    this.createTargetControl();  
    let self = this;
    super.createGraph(data, {
      onresized: () => {
        this.createNeedles({data: null, target: this.barTargets});
      },
      onrendered(this: Chart) {
        this.config('onrendered', null);
        self.chart = this;
        (<any>window).chart = this;
        self.createNeedles(data);
        self.renderTargetControl();
      },
      transition: {
        duration: this.transitionDuration
      }
    });
  }

  updateGraph(data: any) {
    //remove all
    super.updateGraph(data);
    //wait for animation
    this.schedule.queue(() => {
      this.getNeedleGroup()!.remove();
      setTimeout(() => {
        this.createNeedles(data);
        this.schedule.emit();
      }, this.transitionDuration);
      
    });
  }

  private createNeedles({data, target}: any) {
    this.barTargets = target;
    if ( this.needles )
      this.getNeedleGroup()!.remove();

    let grid = this.chart!.$.main.select('.bb-chart') as d3Selection;
    let gridRect = grid.node().getBoundingClientRect();
    let main = this.chart!.$.main.select('.bb-chart-bars') as d3Selection;
    let mainRect: DOMRect = main.node().getBoundingClientRect();
    let bars = this.chart!.$.bar.bars;
    let barsNumber = data && data[0].length - 1 || this.barHeights.length;
    this.barHeights = new Array(barsNumber).fill(0);

    let offsetX = 0, offsetY = 0, width = 0;
    bars.nodes().forEach((elm: HTMLElement, idx: number) => {
      let rect = elm.getBoundingClientRect();
      this.barHeights[idx % barsNumber] += rect.height;
      if ( !width && rect.width )
        width = rect.width;
    });
    
    //n * width + 2*(n-1)*offset = mainRect.width
    this.barWidth = width;
    this.offsetX = offsetX = (gridRect.width - width * barsNumber)/(2*barsNumber);
    this.offsetY = offsetY = (gridRect.height - mainRect.height) + 2;
    this.marginX = this.chart!.$.svg.node().getBoundingClientRect().left - (this.chart!.$.grid as any).main.node().getBoundingClientRect().left;

    console.log(this.marginX)

    this.needles = main.append('g')
      .classed('simple-needle', true);

    let maxHeight = Math.max.apply(null, this.barHeights);

    this.needles
      .selectAll('line')
      .data(<number[]>target.slice(0, barsNumber))
      .enter()
      .append('line')
      .attr('x1', function(d, i) {
        return (2*i + 1)*offsetX + width*i;  
      }).attr('x2', function(d, i) {
        return (2*i + 1)*offsetX + width*(i + 1);
      }).attr('y1', (d: number, i: number) => {
        return offsetY + maxHeight - d*this.barHeights[i];
      }).attr('y2', (d: number, i: number) => {
        return offsetY + maxHeight - d*this.barHeights[i];
      });
  }

  getDataArguments(): [any, string, string, string, string[], string[], string, boolean, boolean] {
    let args: any[] = this.properties.arguments;
    return [this.path, args[0], args[1], args[2], args[3], args[4], args[5], false, true];
  }

  private getNeedleGroup() {
    return this.needles;
  }
}
