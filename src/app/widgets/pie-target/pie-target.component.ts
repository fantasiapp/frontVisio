import { Component, ElementRef, ViewChild } from '@angular/core';
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
  
  constructor(protected ref: ElementRef, protected filtersService: FiltersStatesService, protected sliceDice: SliceDice) {
    super(ref, filtersService, sliceDice);
  }

  createGraph(data: any[]) {
    //draw base curve
    super.createGraph(data);
  }


}
