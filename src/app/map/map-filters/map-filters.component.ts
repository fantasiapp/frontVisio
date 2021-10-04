import { Component, HostBinding, OnInit } from '@angular/core';
import DataExtractionHelper from 'src/app/middle/DataExtractionHelper';
import { PDV } from 'src/app/middle/Slice&Dice';

@Component({
  selector: 'map-filters',
  templateUrl: './map-filters.component.html',
  styleUrls: ['./map-filters.component.css']
})
export class MapFiltersComponent {
  @HostBinding('class.opened')
  opened: boolean = false;

  pdvs: PDV[] = [];

  constructor() { }

  loadCriterion(criterion: string) {
    return Object.entries(DataExtractionHelper.get(criterion));
  }

  exit() {
    
  }
}
