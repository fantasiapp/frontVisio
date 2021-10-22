import { FiltersStatesService } from './../filters/filters-states.service';
import { Component, Input, OnInit } from '@angular/core';
import { Subject } from 'rxjs/internal/Subject';
import { LoggerService } from '../behaviour/logger.service';
import { Logger } from 'ag-grid-community';

@Component({
  selector: 'app-sub-upper-bar',
  templateUrl: './sub-upper-bar.component.html',
  styleUrls: ['./sub-upper-bar.component.css'],
})
export class SubUpperBarComponent implements OnInit {
  constructor(private filtersStates: FiltersStatesService, private logger: LoggerService) {}
  filtersVisibles : boolean = false
  currentDashboard: string = '';
  currentLevel: string =''
  currentYear: string = '';
  path:  string = ''
  years:{ value: (string|number); label: string }[] = [{value : 2020, label:'Année 2020'}, {value : 2021, label:'Année 2021'}]
  ngOnInit(): void {
    this.filtersStates.stateSubject.subscribe(
      (currentState) => {
        this.currentDashboard = currentState.States.dashboard.name;
        this.currentLevel = currentState.States.level.name
        this.path = (<string>currentState.States.path[currentState.States.path.length-1])
      }
    );
    this.filtersStates.filtersVisible.subscribe((val) => 
      this.filtersVisibles = val
    );

    this.currentYear = this.filtersStates.getYear();
  }
  private destroy$: Subject<void> = new Subject<void>();

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onYearChange(e: Event) {
    let current = !!(((e.target as any).value) | 0)
    this.filtersStates.setYear(current);
    this.logger.handleEvent(LoggerService.events.DATA_YEAR_CHANGED, current);
    this.logger.actionComplete();
  }
}
