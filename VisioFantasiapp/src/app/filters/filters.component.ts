import { FiltersStatesService } from './filters-states.service';
import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { ThrowStmt } from '@angular/compiler';
import { Subject } from 'rxjs/internal/Subject';
import { combineLatest } from 'rxjs';

@Component({
  selector: 'app-filters',
  templateUrl: './filters.component.html',
  styleUrls: ['./filters.component.css'],
})
export class FiltersComponent implements OnInit {
  constructor(private filtersState: FiltersStatesService) {}
  blockList: string[] = [];
  levelName: string = '';
  superLevel: string = '';
  subLevel: string = '';
  ngOnInit(): void {
    this.blockToShow();
  }

  private blockToShow() {
  combineLatest([this.filtersState.arraySubject, this.filtersState.stateSubject]).subscribe(([currentsArrays, currentStates]) => {
    if(currentStates.States.level.name === 'National'){
      this.blockList = currentsArrays.dashboardArray!.name
    }else this.blockList = currentsArrays.levelArray!.name;  
    this.levelName = currentStates.States.level.name
    this.superLevel = currentsArrays.levelArray.name
  });
  }

  private destroy$: Subject<void> = new Subject<void>();

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  updateBlock( level : string) {
    // this.filtersState.updateState(2021, level);
    this.blockToShow();
  }

}
