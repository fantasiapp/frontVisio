import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, ViewChild } from '@angular/core';
import { Chart, d3Selection } from 'billboard.js';
import * as d3 from 'd3';
import { LoggerService } from 'src/app/services/logger.service';
import { FiltersStatesService } from 'src/app/filters/filters-states.service';
import DEH from 'src/app/middle/DataExtractionHelper';
import { SliceDice } from 'src/app/middle/Slice&Dice';
import { BasicWidget } from '../BasicWidget';
import { TargetService } from '../description-widget/description-service.service';
import { HistoColumnComponent } from '../histocolumn/histocolumn.component';

//❌
@Component({
  selector: 'app-historow-target',
  templateUrl: './histocolumn-target.component.html',
  styleUrls: ['./histocolumn-target.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HistoColumnTargetComponent extends HistoColumnComponent {
  @ViewChild('content', {read: ElementRef})
  protected content!: ElementRef;

  @ViewChild('openTargetControl', {read: ElementRef})
  protected openTargetControl!: ElementRef;

  private transitionDuration = 250;
  private needles?: d3Selection;
  private barHeights: number[] = [];
  private barTargets: number[] = [];
  private offsetX: number = 0;
  private offsetY: number = 0;
  private marginX: number = 0;
  private barWidth: number = 0;
  _inputIsOpen: boolean = false;
  canSetTargets: boolean = true;
  private data?: any;

  get inputIsOpen() { return this._inputIsOpen; }
  set inputIsOpen(val: boolean) {
    let event: number = val ? LoggerService.events.WIDGET_PARAMS_ADDED : LoggerService.events.WIDGET_PARAMS_REMOVED,
      id: number = parseInt(DEH.getKeyByValue(DEH.get('widget'), 'histoColumnTarget')!);
    
    this.logger.handleEvent(event, id);
    this.logger.actionComplete();
    this._inputIsOpen = val;
  }

  constructor(protected ref: ElementRef, protected filtersService: FiltersStatesService, protected sliceDice: SliceDice, protected logger: LoggerService, protected targetService: TargetService, protected cd: ChangeDetectorRef) {
    super(ref, filtersService, sliceDice);
    this.subscribe(this.targetService.targetChange, value => {
      if ( this.inputIsOpen ) this.toggleTargetControl();
      this.canSetTargets = !this.canSetTargets;
      let data = this.updateData() as any;
      if ( this.needles )
        this.createNeedles(data);
      this.cd.markForCheck();
    });
  }

  private newTargetControl(empty: boolean = true) { 
    let ref = d3.select(this.ref.nativeElement);
    let container =  ref.select('div.target-control');
    if ( container.empty() ) {
      ref.insert('div', 'div.container')
        .classed('target-control', true);
    } else {
      if ( empty ) container.selectAll('*').remove();
    };
    return container;
  };

  private renderTargetContainer(data: any) {
    this.createNeedles(data);
    if ( this.inputIsOpen )
      this.renderTargetControl();
  }

  private getTargetValue(d: number): string {
    return BasicWidget.format(DEH.get(this.data.targetLevel['name'])[this.data.targetLevel['ids'][d]][DEH.get(this.data.targetLevel['structure']).indexOf(this.data.targetLevel['volumeIdentifier'])]);
  }

  private renderTargetControl() {
    let barsNumber = this.barHeights.length;
    let coeff = 0.4;
    let container = this.newTargetControl();

    container
      .style('margin-left', (10 + this.marginX) + 'px')
      .selectAll('input')
      .data(d3.range(barsNumber))
      .enter()
        .append('input')
        .attr('value', (d) => this.getTargetValue(d))
        // .attr('value', (d) => d)
        .attr('type', 'text')
        .style('width', ((this.barWidth*(1 + coeff)).toFixed(1)) + 'px')
        .style('margin', '0 ' + ((this.offsetX - this.barWidth*coeff/2).toFixed(1)) + 'px')
        .on('input', (e: Event) => {
          let input = e.target as any,
            target = +input.value.replace(/\s+/g, '');
          input.value = BasicWidget.format(target);
        })
        .on('change', (e: Event) => {
          let input = e.target as any,
            target = +input.value.replace(/\s+/g, '');

          if ( Number.isNaN(target) ) {
            input.classList.add('incorrect-input');
          } else {
            input.classList.remove('incorrect-input');
            input.value = BasicWidget.format(target);
            this.changeValue(target, input.__data__, e);
          }
        })
    return container;
  }

  createGraph(data: any) {
    let self = this;
    this.data = data;
    super.createGraph(data, {
      onresized(this: any) {
        let chart = self.chart!;
        let rect = (chart.$.main.select('.bb-chart').node() as Element).getBoundingClientRect();
        self.rect = rect;
        self.renderTargetContainer({data: null, target: self.barTargets});
      },
      onrendered(this: Chart) {
        let rect = (this.$.main.select('.bb-chart').node() as Element).getBoundingClientRect();
        self.rect = rect;
        self.chart = this;
        self.renderTargetContainer(data); //initial render
        this.config('onrendered', null);
      },
      transition: {
        duration: this.transitionDuration
      }
    });
  }

  updateGraph(data: any) {
    //wait for animation
    super.updateGraph(data); //queue first
    this.getNeedleGroup()?.remove();
    this.schedule.queue(() => {
      this.data = data;
      setTimeout(() => {
        this.createNeedles(data);
        this.schedule.next();
        if ( this.inputIsOpen ) { this.cd.markForCheck(); }
      }, this.transitionDuration);
    });
  }

  private createNeedles(allData: any) {
    let data = allData.data;
    let target = this.barTargets = this.canSetTargets ? allData.target : allData.ciblage;
    if ( this.needles )
      this.getNeedleGroup()!.remove();

    let grid = this.chart!.$.main.select('.bb-chart') as d3Selection;
    let gridRect = grid.node().getBoundingClientRect();
    let main = this.chart!.$.main.select('.bb-chart-bars') as d3Selection;
    let mainRect: DOMRect = main.node().getBoundingClientRect();
    let bars = this.chart!.$.bar.bars;
    let barsNumber = data && (data[0].length - 1) || (this.barHeights && this.barHeights.length);
    this.barHeights = new Array(barsNumber).fill(0);

    let offsetX = 0, offsetY = 0, width = 0;
    bars.nodes().forEach((elm: HTMLElement, idx: number) => {
      let rect = elm.getBoundingClientRect();
      this.barHeights[idx % barsNumber] += rect.height;
      if ( !width && rect.width )
        width = rect.width;
    });
    
    //n * width + 2*n*offset = mainRect.width
    this.barWidth = width;
    this.offsetX = offsetX = (gridRect.width - width * barsNumber)/(2*barsNumber);
    this.offsetY = offsetY = (gridRect.height - mainRect.height) + 2;
    this.marginX = (this.chart!.$.grid as any).main.node().getBoundingClientRect().left - this.chart!.$.svg.node().getBoundingClientRect().left;

    this.needles = main.append('g')
      .classed('simple-needle', true);

    let maxHeight = Math.max.apply(null, this.barHeights);

    this.needles
      .selectAll('line')
      .data(<number[]>(target || []).slice(0, barsNumber))
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
    return [this.node, args[0], args[1], args[2], args[3], args[4], args[5], false, true];
  }

  private getNeedleGroup() {
    return this.needles;
  }

  toggleTargetControl() {
    this.inputIsOpen = !this.inputIsOpen;
    
    d3.select(this.content.nativeElement)
      .classed('target-control-opened', this.inputIsOpen);
    
    //make target control just in case
    this.renderTargetControl()
      .classed('target-control-opened', this.inputIsOpen);
  }

  changeValue(newValue : number, inputId: number, fullEvent: any) {
    this.sliceDice.updateTargetLevel(newValue, this.data.targetLevel['name'], this.data.targetLevel['ids'][inputId], this.data.targetLevel['volumeIdentifier'], this.data.targetLevel['structure'])
  }
}
