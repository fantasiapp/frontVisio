import { FiltersStatesService } from './filters-states.service';
import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { ThrowStmt } from '@angular/compiler';
import { Subject } from 'rxjs/internal/Subject';
import { combineLatest } from 'rxjs';
import { Level } from '../navigation/Level';

interface listDash  {
  name : string [],
  id : number []
}
interface listLev {
  name : string []
  id : number []
}
@Component({
  selector: 'app-filters',
  templateUrl: './filters.component.html',
  styleUrls: ['./filters.component.css'],
})
export class FiltersComponent implements OnInit {
  constructor(private filtersState: FiltersStatesService) {}
  listDashboard!: listDash;
  listLevel! : listLev;
  viewList!: listLev | listDash;
  selectList!: listDash;
  currentLev : any ; 
  levelName: string = '';
  superLevel!: {
    name : string,
    id : string,
  }
  value: number = 0
  subLevels!: listLev
  sort: number = 0
  ngOnInit(): void {
    this.blockToShow();
    combineLatest([
      this.filtersState.arraySubject,
      this.filtersState.stateSubject,
    ]).subscribe(([currentsArrays, currentStates]) => {
      this.listLevel = currentsArrays.levelArray.currentLevel; 
      this.subLevels = currentsArrays.levelArray.subLevel;
      this.listDashboard = currentsArrays.dashboardArray;
      this.superLevel = currentsArrays.levelArray.superLevel.name;
      this.currentLev = currentStates.States.Level
      // console.debug('la liste des dashBoard', this.listDashboard)
      this.levelName =
        currentStates.States.level.label == ''
          ? 'National'
          : currentStates.States.level.label;

      this.viewList = this.subLevels;
    });
  }

  private blockToShow() {
  }

  private destroy$: Subject<void> = new Subject<void>();

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  updateBlock(
    level: listLev
  ) {
    console.debug(this.subLevels)
    this.viewList = level;
  }

  updateState(indexLev?: number, indexDash?: number ){  
    if(indexLev) {this.filtersState.updateState(this.subLevels.id[indexLev-1])
       console.debug('index list', this.subLevels.id[indexLev])}
    else if (indexDash) this.filtersState.updateState(this.listDashboard.id[indexDash])
    this.blockToShow()
  }
}
