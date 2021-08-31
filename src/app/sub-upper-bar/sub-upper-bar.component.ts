import { FiltersStatesService } from './../filters/filters-states.service';
import { Component, OnInit } from '@angular/core';
import { Subject } from 'rxjs/internal/Subject';
import { Level } from '../navigation/Level';

@Component({
  selector: 'app-sub-upper-bar',
  templateUrl: './sub-upper-bar.component.html',
  styleUrls: ['./sub-upper-bar.component.css'],
})
export class SubUpperBarComponent implements OnInit {
  constructor(private filtersStates: FiltersStatesService) {}
  currentDashboard: string = '';
  currentLevel: string =''
  path:  string = ''
  ngOnInit(): void {
    this.filtersStates.stateSubject.subscribe(
      (currentState) => {
        this.currentDashboard = currentState.States.dashboard.name;
        this.currentLevel = currentState.States.level.name
        this.path = currentState.States.path
      }
    );
  }
  private destroy$: Subject<void> = new Subject<void>();

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
