import { Component, ElementRef } from '@angular/core';
import { FiltersStatesService } from 'src/app/filters/filters-states.service';
import { SliceDice } from 'src/app/middle/Slice&Dice';
import { SimplePieComponent } from '../simple-pie/simple-pie.component';

@Component({
  selector: 'app-pie-target',
  templateUrl: './pie-target.component.html',
  styleUrls: ['./pie-target.component.css']
})
export class PieTargetComponent extends SimplePieComponent {

  constructor(protected ref: ElementRef, protected filtersService: FiltersStatesService, protected sliceDice: SliceDice) {
    super(ref, filtersService, sliceDice);
  }

  createGraph(data: any[]) {
    //draw base curve
    super.createGraph(data);
    //this.chart.
  }
}
