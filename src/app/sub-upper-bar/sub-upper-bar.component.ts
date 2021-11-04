import { FiltersStatesService } from './../filters/filters-states.service';
import { Component, Input, OnInit } from '@angular/core';
import { Subject } from 'rxjs/internal/Subject';
import { LoggerService } from '../behaviour/logger.service';
import DEH, { Params } from '../middle/DataExtractionHelper';
import { PDV } from '../middle/Slice&Dice';

@Component({
  selector: 'app-sub-upper-bar',
  templateUrl: './sub-upper-bar.component.html',
  styleUrls: ['./sub-upper-bar.component.css'],
})
export class SubUpperBarComponent implements OnInit {
  constructor(private filtersStates: FiltersStatesService, private logger: LoggerService) {}
  currentDashboardId: number = 0;
  currentDashboard: string = '';
  currentLevel: string ='';
  currentMonth: string = '';
  currentYear: string = '';
  path:  string = ''
  years: [number, number] = [Params.currentYear, Params.currentYear-1]
  otherYearDashboards: any;

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
    this.otherYearDashboards = DEH.getOtherYearDashboards(this.filtersStates.navigation.tree!, this.filtersStates.stateSubject.value.States.path.length - 1)
    this.logger.handleEvent(LoggerService.events.DATA_YEAR_CHANGED, current);
    this.logger.actionComplete();
    this.currentYear = current ? this.filtersStates.getYear() : '';
  }
}
