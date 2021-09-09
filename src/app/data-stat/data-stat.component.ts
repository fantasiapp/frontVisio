import { DataService } from './../services/data.service';
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';
import { Injectable } from '@angular/core';
import { dashboardLayout } from './../structure/mock-layout';
import { FiltersStatesService } from './../filters/filters-states.service';
import { Component, OnInit } from '@angular/core';
import Dashboard from '../sliceDice/Dashboard';
import {Navigation} from 'src/app/sliceDice/Navigation';

@Component({
  selector: 'app-data-stat',
  templateUrl: './data-stat.component.html',
  styleUrls: ['./data-stat.component.css'],
})
export class DataStatComponent implements OnInit {
  constructor(private filtersState: FiltersStatesService, private nav: Navigation) {
    //Request data
  }
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
      
      if ( this.nav.currentLevel ) {
        this.path = this.nav.getCurrent()._path.slice(1).reduce((acc: {[key:string]:number}, level: [string, number], idx: number) => {
          if ( idx == 0 )
            acc['Région'] = level[1]
          else acc[level[0]]=level[1];
          return acc;
        }, {});
      }
    });
  }

  public path = {};
}
