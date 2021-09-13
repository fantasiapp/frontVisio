import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { GridArea } from 'src/app/grid/grid-area/grid-area';
import * as d3 from 'd3';
import { SliceDice } from 'src/app/sliceDice/Slice&Dice';
import { FiltersStatesService } from 'src/app/filters/filters-states.service';
import { Subject, combineLatest } from 'rxjs';

@Component({
  selector: 'app-simple-pie',
  templateUrl: './simple-pie.component.html',
  styleUrls: ['./simple-pie.component.css'],
  providers: [SliceDice]
})
export class SimplePieComponent extends GridArea implements AfterViewInit {
  constructor(private ref: ElementRef, private filtersService: FiltersStatesService, private sliceDice: SliceDice) {
    super();

    combineLatest([filtersService.$path, this.ready!]).subscribe(([path, _]) => {
      this.path = path;
      this.update();
    });
    
  }

  private update() {
    d3.select(this.ref.nativeElement).selectAll('div > svg').remove();
    this.rect = this.ref.nativeElement.getBoundingClientRect()
    this.data = this.sliceDice.dnMarcheP2cd(this.path);
    console.log('$', this.rect);
    this.createSvg();
    this.createColors();
    this.drawChart();
  }
  
  private path = {};
  private data: any[] = []; //nationalP2CD.tableauHaut;
  private svg: any = {};
  private margin = 150;
  private rect: DOMRect | null = null;

  private colors: any = {};
  private legendRectSize = 18;
  private legendSpacing = 9;

  createSvg(): void {
    let rect = this.rect!;

    this.svg = d3
      .select(this.ref.nativeElement)
      .append('svg')
      .attr('width', Math.round(rect.width))
      .attr('height', Math.round(rect.height))
      .classed("svg-content", true)
      .append('g')
      .attr(
        'transform',
        'translate(' + rect.width / 2 + ',' + rect.height / 2 + ')'
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
    let rect = this.rect!,
        radius = Math.min(rect.width, rect.height) / 2 - this.margin;

    this.svg
      .selectAll('pieces')
      .data(pie(this.data))
      .enter()
      .append('path')
      .attr('d', d3.arc().innerRadius(0).outerRadius(radius+30))
      .attr('fill', (d: any, i: number) => this.colors(i))
      .attr('transform', 'translate(' + -50 + ',' + -80 + ')');

    // Add labels
    const labelLocation = d3.arc().innerRadius(100).outerRadius(radius);

    // this.svg
    //   .selectAll('pieces')
    //   .data(pie(this.data))
    //   .enter()
    //   .append('text')
    //   .text((d: any) => d.data.label)
    //   .attr(
    //     'transform',
    //     (d: any) => 'translate(' + labelLocation.centroid(d) + ')'
    //   )
    //   .style('text-anchor', 'middle')
    //   .style('font-size', 15);

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
