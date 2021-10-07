import { Component, ElementRef, ViewChild } from '@angular/core';
import { Chart, d3Selection } from 'billboard.js';
import * as d3 from 'd3';
import { FiltersStatesService } from 'src/app/filters/filters-states.service';
import DataExtractionHelper from 'src/app/middle/DataExtractionHelper';
import { SliceDice } from 'src/app/middle/Slice&Dice';
import { HistoColumnComponent } from '../histocolumn/histocolumn.component';

//❌
@Component({
  selector: 'app-historow-target',
  templateUrl: './histocolumn-target.component.html',
  styleUrls: ['./histocolumn-target.component.css']
})
export class HistoColumnTargetComponent extends HistoColumnComponent {
  @ViewChild('content', {read: ElementRef})
  protected content!: ElementRef;

  @ViewChild('openTargetControl', {read: ElementRef})
  protected openTargetControl!: ElementRef;

  private transitionDuration = 0;
  private needles?: d3Selection;
  private barHeights: number[] = [];
  private barTargets: number[] = [];
  private offsetX: number = 0;
  private offsetY: number = 0;
  private marginX: number = 0;
  private barWidth: number = 0;
  inputIsOpen: boolean = false;
  private data?: any;
  
  constructor(protected ref: ElementRef, protected filtersService: FiltersStatesService, protected sliceDice: SliceDice) {
    super(ref, filtersService, sliceDice);
  }

  private newTargetControl() { 
    let ref = d3.select(this.ref.nativeElement);
    let container =  ref.select('div.target-control');
    if ( container.empty() ) {
      ref.insert('div', 'div.container')
        .classed('target-control', true);
    } else {
      container.selectAll('*').remove();
    };
    return container;
  };

  private renderTargetContainer(data: any) {
    this.createNeedles(data);
    if ( this.inputIsOpen )
      this.renderTargetControl();
  };

  private renderTargetControl() {
    let barsNumber = this.barHeights.length;
    let container = this.newTargetControl();
    container
      .style('margin-left', (10 + this.marginX) + 'px')
      .selectAll('input')
      .data(d3.range(barsNumber))
      .enter()
        .append('input')
        .attr('value', (d) => +DataExtractionHelper.get("targetLevelDrv")[Object.keys(DataExtractionHelper.get('drv'))[d]][DataExtractionHelper.getKeyByValue(DataExtractionHelper.get('structureTargetLevelDrv'), this.data.updateTargetName)!])
        // .attr('value', (d) => d)
        .attr('type', 'number')
        .on('change', (event) => {console.log("change : ", event.target.value), this.changeValue(event.target.value, event.target.__data__, event)})
        .style('width', (this.barWidth.toFixed(1)) + 'px')
        .style('margin', '0 ' + (this.offsetX.toFixed(1)) + 'px');
      return container;
  }

  createGraph(data: any) {
    let self = this;
    this.data = data;
    super.createGraph(data, {
      onresized: () => {
        this.renderTargetContainer({data: null, target: this.barTargets});
      },
      onrendered(this: Chart) {
        let rect = (this.$.main.select('.bb-chart').node() as Element).getBoundingClientRect();
        self.rectHeight = rect.height;
        self.chart = this;
        self.renderTargetContainer(data);
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
      setTimeout(() => {
        this.createNeedles(data);
        this.schedule.next();
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
    this.marginX = (this.chart!.$.grid as any).main.node().getBoundingClientRect().left - this.chart!.$.svg.node().getBoundingClientRect().left;

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

  toggleTargetControl() {
    this.inputIsOpen = !this.inputIsOpen;
    
    let self = this;
    let container = d3.select(this.content.nativeElement)
      .classed('target-control-opened', this.inputIsOpen);
    
    //make target control just in case
    this.renderTargetControl()
      .classed('target-control-opened', this.inputIsOpen);
  }

  doTargetControl() {
    console.log('[HistoRowTargetComponent]: Target control validated:\nRespect+.');
    //close
    this.toggleTargetControl();
  }

  changeValue(newValue :number, inputId: number, fullEvent: any) {
    this.sliceDice.updateTargetLevelDrv(inputId, newValue, this.data.updateTargetName)
  }
}
