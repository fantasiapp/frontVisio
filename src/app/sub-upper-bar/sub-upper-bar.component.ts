import { FiltersStatesService } from './../filters/filters-states.service';
import { Component, OnInit } from '@angular/core';
import { Subject } from 'rxjs/internal/Subject';
import DEH, { Params } from '../middle/DataExtractionHelper';

@Component({
  selector: 'app-sub-upper-bar',
  templateUrl: './sub-upper-bar.component.html',
  styleUrls: ['./sub-upper-bar.component.css'],
})
export class SubUpperBarComponent implements OnInit {
  constructor(private filtersStates: FiltersStatesService) {}
  currentDashboardId: number = 0;
  currentDashboard: string = '';
  currentLevel: string ='';
  currentMonth: string = '';
  currentYear: string = '';
  path:  string = ''
  years: [number, number] = [Params.currentYear, Params.currentYear-1]
  otherYearDashboards: any; //-> whether we can transition to another year on this dashboard

  ngOnInit(): void {
    this.filtersStates.stateSubject.subscribe(
      ({States}) => {
        let height = States.path.length;
        this.currentDashboard = States.dashboard.name;
        this.currentLevel = States.level.name;
        this.path = (<string>States.path[States.path.length-1]);
        this.currentDashboardId = States.dashboard.id;
        this.otherYearDashboards = DEH.getOtherYearDashboards(this.filtersStates.navigation.tree!, height-1);  
      }
    );

    this.currentYear = this.filtersStates.getYear();
    this.currentMonth = this.filtersStates.getMonth();
  }
  private destroy$: Subject<void> = new Subject<void>();

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onYearChange(e: Event) {
    let current = !!(((e.target as any).value) | 0);
    this.filtersStates.setYear(current);
    this.otherYearDashboards = DEH.getOtherYearDashboards(this.filtersStates.navigation.tree!, this.filtersStates.stateSubject.value.States.path.length - 1);
    this.currentYear = current ? this.filtersStates.getYear() : '';
  }
}
