import { Component, HostBinding, OnInit } from '@angular/core';

@Component({
  selector: 'map-filters',
  templateUrl: './map-filters.component.html',
  styleUrls: ['./map-filters.component.css']
})
export class MapFiltersComponent {
  @HostBinding('class.opened')
  opened: boolean = false;

  constructor() { }

  ngOnInit(): void {
  }
}
