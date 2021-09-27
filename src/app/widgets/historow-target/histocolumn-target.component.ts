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
  
  constructor(protected ref: ElementRef, protected filtersService: FiltersStatesService, protected sliceDice: SliceDice) {
    super(ref, filtersService, sliceDice);
    
  }

  createGraph(data: any) {
    let self = this;
    super.createGraph(data, {
      onresized: () => {
        this.createNeedles({data: null, target: this.barTargets});
      },
      onrendered(this: Chart) {
        self.chart = this;
        (<any>window).chart = this;
        self.createNeedles(data);       
        this.config('onrendered', null);
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
    offsetX = (gridRect.width - width * barsNumber)/(2*barsNumber);
    offsetY = (gridRect.height - mainRect.height) + 2;

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
