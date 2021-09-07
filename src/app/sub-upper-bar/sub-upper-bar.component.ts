import { FiltersStatesService } from './../filters/filters-states.service';
import { Component, Input, OnInit } from '@angular/core';
import { Subject } from 'rxjs/internal/Subject';

@Component({
  selector: 'app-sub-upper-bar',
  templateUrl: './sub-upper-bar.component.html',
  styleUrls: ['./sub-upper-bar.component.css'],
})
export class SubUpperBarComponent implements OnInit {
  constructor(private filtersStates: FiltersStatesService) {}
  filtersVisibles : boolean = false
  currentDashboard: string = '';
  currentLevel: string =''
  path:  string = ''
  years:{ value: (string|number); label: string }[] = [{value : 2020, label:'Année 2020'}, {value : 2021, label:'Année 2021'}]
  ngOnInit(): void {
    this.filtersStates.stateSubject.subscribe(
      (currentState) => {
        this.currentDashboard = currentState.States.dashboard.name;
        this.currentLevel = currentState.States.level.name
        this.path = currentState.States.path[currentState.States.path.length-1]
      }
    );
    this.filtersStates.filtersVisible.subscribe((val) => 
      this.filtersVisibles = val
    )
  }
  private destroy$: Subject<void> = new Subject<void>();

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
