import { Component, ElementRef, HostBinding, OnInit } from '@angular/core';
import * as d3 from 'd3';
import * as britecharts from 'britecharts'

@Component({
  selector: 'app-piechart',
  templateUrl: './piechart.component.html',
  styleUrls: ['./piechart.component.css']
})
export class PieChartComponent implements OnInit {

  constructor(private element: ElementRef) { }

  ngOnInit(): void {
    let root = d3.select(this.element.nativeElement);
    const barChart = britecharts.bar();
    const barData = [
      { name: 'Luminous', value: 2 },
      { name: 'Glittering', value: 5 },
      { name: 'Intense', value: 4 },
      { name: 'Radiant', value: 3 }
    ];

    barChart.margin({left: 100}).isHorizontal(true).height(400).width(600);

    root.datum(barData).call(barChart);

    const redrawChart = () => {
      const newContainerWidth = root.node() ? root.node().getBoundingClientRect().width : false;
  
      // Setting the new width on the chart
      barChart.width(newContainerWidth);
  
      // Rendering the chart again
      root.call(barChart);
    };
    
    const throttledRedraw = PieChartComponent.throttle(redrawChart, 200) as any;
    window.addEventListener("resize", throttledRedraw);
  
  }

  static throttle(func: Function, delay:number): Function {
    let timer: any = 0;

    return function() {
        let args: any[] = [].slice.call(arguments);

        clearTimeout(timer);
        timer = setTimeout(function() {
            func.apply(null, args);
        }, delay);
    };
}
}
