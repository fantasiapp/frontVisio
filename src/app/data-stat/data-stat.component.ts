import { dashboardLayout } from './../structure/mock-layout';
import { FiltersStatesService } from './../filters/filters-states.service';
import { Component, OnInit } from '@angular/core';
import Dashboard from '../navigation/Dashboard';
import {Navigation} from 'src/app/navigation/Navigation';

@Component({
  selector: 'app-data-stat',
  templateUrl: './data-stat.component.html',
  styleUrls: ['./data-stat.component.css'],
})
export class DataStatComponent implements OnInit {
  constructor(private filtersState: FiltersStatesService, private nav: Navigation) {}
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
            acc['DRV'] = level[1]
          else acc[level[0]]=level[1];
          return acc;
        }, {});

        console.log('>>', this.path);
      }
    });
  }

  public path = {};

  private transformPath(path: string[]): {[key:string]: number} {
    
    return path.slice(1).map((level: string) => {
      let comp = level.split(':');
      console.log(comp[0], comp[1]);
      return [comp[0], comp[1]]
    }).reduce((acc: {[key:string]:number}, level: string[]) => { acc[level[0]]=parseInt(level[1]); return acc }, {});
  }
}
