import { AfterViewInit, Component, ElementRef, Input, OnChanges, OnInit, ViewChild } from '@angular/core';
import { GridArea } from 'src/app/grid/grid-area/grid-area';
import * as d3 from 'd3';
import { SliceDice } from 'src/app/sliceDice/Slice&Dice';
import { FiltersStatesService } from 'src/app/filters/filters-states.service';

@Component({
  selector: 'app-simple-donut',
  templateUrl: './simple-donuts.component.html',
  styleUrls: ['./simple-donuts.component.css'],
  providers: [SliceDice]
})
export class SimpleDonutsComponent extends GridArea implements OnInit, OnChanges, AfterViewInit {
  @ViewChild('container', {read: ElementRef})
  private container!: ElementRef;
  
  constructor(private filtersService: FiltersStatesService, private sliceDice: SliceDice) {
    super();
    filtersService.$path.subscribe(path => {
      this.path = path;
      this.update();
    });
  }

  ngOnInit() {
    
  }

  ngAfterViewInit(): void {
    this.update();
  }

  ngOnChanges(): void {
    this.update();
  }

  private update() {
    if ( !this.container ) return;
    this.data = this.sliceDice.p2cdMarcheP2cd(this.path);
    d3.select(this.container.nativeElement).selectAll('div > svg').remove();
    this.createSvg();
    this.createColors();
    this.drawChart();
  }
  
  public path = {};

  private data: any[] = []; //nationalP2CD.tableauHaut;
  private svg: any = {};
  private margin = 150;
  private width = 750;
  private height = 600;

  private radius = Math.min(this.width, this.height) / 2 - this.margin;
  private colors: any = {};
  private legendRectSize = 18;
  private legendSpacing = 9;

  createSvg(): void {
    this.svg = d3
      .select(this.container.nativeElement)
      .append('svg')
      .attr('preserveAspectRatio', 'xMinYMin meet')
      .attr('viewBox', '0 0 ' + (this.width+400) + ' ' + this.height)
      .classed("svg-content", true)
      .append('g')
      .attr(
        'transform',
        'translate(' + this.width / 2 + ',' + this.height / 2 + ')'
      )
  }
  createColors(): void {
    this.colors = d3
      .scaleOrdinal()
      .domain(this.data.map((d) => d.value.toString()))
      .range(['#DC6206', '#888888', '#E1962A', '#DEDEDE']);
  }
  drawChart(): void {
    // Compute the position of each group on the pie:
    const pie = d3.pie<any>().value((d: any) => Number(d.value));

    this.svg
      .selectAll('pieces')
      .data(pie(this.data))
      .enter()
      .append('path')
      .attr('d', d3.arc().innerRadius(this.radius / 2).outerRadius(this.radius+30))
      .attr('fill', (d: any, i: number) => this.colors(i))
      .attr('transform', 'translate(' + -50 + ',' + -80 + ')');

    // Add labels
    const labelLocation = d3.arc().innerRadius(100).outerRadius(this.radius);

    const legend = this.svg
      .selectAll('.legend')
      .data(pie(this.data))
      .enter()
      .append('g')
      .attr('class', 'legend')
      .attr('transform', (d: any, i: number) => {
        const height = this.legendRectSize + this.legendSpacing;
        const horz = 2 * this.legendRectSize + 200;
        const vert = -i * height + 100;
        return 'translate(' + horz + ',' + vert + ')';
      });

    legend
      .append('rect')
      .attr('width', this.legendRectSize)
      .attr('height', this.legendRectSize)
      .style('fill', (d: any, i: number) => this.colors(i))
      .style('stroke', (i: number) => this.colors(i));

    legend
      .append('text')
      .attr('x', this.legendRectSize + this.legendSpacing)
      .attr('y', this.legendRectSize - this.legendSpacing + 5)
      .text((d: any) => d.data.label);
  }
}
