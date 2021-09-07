import { dashboardLayout } from './../structure/mock-layout';
import { FiltersStatesService } from './../filters/filters-states.service';
import { Component, OnInit } from '@angular/core';
import Dashboard from '../navigation/Dashboard';

@Component({
  selector: 'app-data-stat',
  templateUrl: './data-stat.component.html',
  styleUrls: ['./data-stat.component.css'],
})
export class DataStatComponent implements OnInit {
  constructor(private filtersState: FiltersStatesService) {}
  layout: number = 0;

  ngOnInit(): void {
    this.filtersState.stateSubject.subscribe((currentState) => {
      const elmt = dashboardLayout.layout.find(
        (element) => +element.dashboardId == currentState.States.dashboard.id
      )
        ? dashboardLayout.layout.find(
            (element) =>
              +element.dashboardId == currentState.States.dashboard.id
          )
        : {
            dashboardId: '0',
            LayOut: '0',
          };
      this.layout = +elmt!.LayOut;
    });
  }
}
