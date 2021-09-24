import { Component, ElementRef, ViewChild } from '@angular/core';
import { Chart, d3Selection } from 'billboard.js';
import * as d3 from 'd3';
import { FiltersStatesService } from 'src/app/filters/filters-states.service';
import { SliceDice } from 'src/app/middle/Slice&Dice';
import { HistoColumnComponent } from '../histocolumn/histocolumn.component';

@Component({
  selector: 'app-historow-target',
  templateUrl: './histocolumn-target.component.html',
  styleUrls: ['./histocolumn-target.component.css']
})
export class HistoColumnTargetComponent extends HistoColumnComponent {
  @ViewChild('content', {read: ElementRef})
  protected content!: ElementRef;

  private transitionDuration = 250;
  private needles?: d3Selection;
  private barHeights: number[] = [];
  private needlesGroupTranslate: [number, number] = [0, 0];
  private needleTranslate: [number, number][] = [];
  
  constructor(protected ref: ElementRef, protected filtersService: FiltersStatesService, protected sliceDice: SliceDice) {
    super(ref, filtersService, sliceDice);
    
  }

  createGraph(data: any[]) {
    let self = this;
    super.createGraph(data, {
      onresized: () => {
        this.createNeedles(null)
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

  private createNeedles(data: any) {
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
      .data([1, 0.8, 0.6, 0.4, 0.2, 0.5, 0.76].slice(0, barsNumber))
      .enter()
      .append('line')
      .attr('x1', function(d, i) {
        return (2*i + 1)*offsetX + width*i;  
      }).attr('x2', function(d, i) {
        return (2*i + 1)*offsetX + width*(i + 1);
      }).attr('y1', (d, i) => {
        return offsetY + maxHeight - d*this.barHeights[i];
      }).attr('y2', (d, i) => {
        return offsetY + maxHeight - d*this.barHeights[i];
      });
  }

  private getNeedleGroup() {
    return this.needles;
  }
}
