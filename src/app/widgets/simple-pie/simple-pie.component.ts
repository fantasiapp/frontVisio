import { nationalP2CD } from './../../structure/test-widget';
import { Component, OnInit } from '@angular/core';
import * as d3 from 'd3';
@Component({
  selector: 'app-simple-pie',
  templateUrl: './simple-pie.component.html',
  styleUrls: ['./simple-pie.component.css'],
})
export class SimplePieComponent implements OnInit {
  constructor() {}

  ngOnInit(): void {
    this.createSvg();
    this.createColors();
    this.drawChart();
  }
  private data = nationalP2CD.tableauHaut;
  private svg: any = {};
  private margin = 50;
  private width = 750;
  private height = 600;

  private radius = Math.min(this.width, this.height) / 2 - this.margin;
  private colors: any = {};
  private legendRectSize = 18;                                  
  private legendSpacing = 4; 

  createSvg(): void {
    this.svg = d3
      .select('figure#pie')
      .append('svg')
      .attr('width', this.width)
      .attr('height', this.height)
      .append('g')
      .attr(
        'transform',
        'translate(' + this.width / 2 + ',' + this.height / 2 + ')'
      );
  }
  createColors(): void {
    this.colors = d3
      .scaleOrdinal()
      .domain(this.data.map((d) => d.valeur.toString()))
      .range(['#c7d3ec', '#a5b8db', '#879cc4', '#677795']);
  }
  drawChart(): void {
    // Compute the position of each group on the pie:
    const pie = d3.pie<any>().value((d: any) => Number(d.valeur));

    // Build the pie chart
    this.svg
      .selectAll('pieces')
      .data(pie(this.data))
      .enter()
      .append('path')
      .attr('d', d3.arc().innerRadius(0).outerRadius(this.radius))
      .attr('fill', (d: any, i: number) => this.colors(i))
      .attr('stroke', 'blue')
      .style('stroke-width', '1px');

    // Add labels
    const labelLocation = d3.arc().innerRadius(100).outerRadius(this.radius);

    this.svg
      .selectAll('pieces')
      .data(pie(this.data))
      .enter()
      .append('text')
      .text((d: any) => d.data.label)
      .attr(
        'transform',
        (d: any) => 'translate(' + labelLocation.centroid(d) + ')'
      )
      .style('text-anchor', 'middle')
      .style('font-size', 15);



      var legend = this.svg.selectAll('.legend')                     
      .data(pie(this.data))                                   
      .enter()                                                
      .append('g')                                            
      .attr('class', 'legend')                                
      .attr('transform', (d:any, i:number) => {                     
        const height = this.legendRectSize + this.legendSpacing;          
        const offset =  height * this.colors(i).length / 2;     
        const horz = -2 * this.legendRectSize;                       
        const vert = i * height - offset;                       
        return 'translate(' + horz + ',' + vert + ')';        
      })                                                 

    legend.append('rect')                                     
      .attr('width', this.legendRectSize)                          
      .attr('height', this.legendRectSize)                         
      .style('fill', (d:any, i:number) => this.colors[i])                                   
      .style('stroke', (i:number) =>this.colors[i]);                                
      
    legend.append('text')                                     
      .attr('x', this.legendRectSize + this.legendSpacing)              
      .attr('y', this.legendRectSize - this.legendSpacing)              
      .text((d:any) => d.data.label); 
  }
}
