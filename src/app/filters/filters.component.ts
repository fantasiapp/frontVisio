import { FiltersStatesService } from './filters-states.service';
import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { ThrowStmt } from '@angular/compiler';
import { Subject } from 'rxjs/internal/Subject';
import { combineLatest } from 'rxjs';

interface listDash {
  name: string[];
  id: number[];
}
interface listLev {
  name: string[];
  id: number[];
  label: string[];
}
interface lev {
  name: string;
  id: number;
  label:string;
}
@Component({
  selector: 'app-filters',
  templateUrl: './filters.component.html',
  styleUrls: ['./filters.component.css'],
})
export class FiltersComponent implements OnInit {
  constructor(private filtersState: FiltersStatesService) {}

  listDashboard!: listDash;
  listLevel!: listLev;
  viewList!: listLev | listDash;
  selectList!: listDash;
  currentLev: any;
  levelName: string = '';
  superLevel!: lev;
  value: number = 0;
  subLevels!: listLev;
  sort: number = 0;
  showselect : boolean = false;
  path : string ='';
  idLevel: number = 0;
  ngOnInit(): void {
    combineLatest([
      this.filtersState.arraySubject,
      this.filtersState.stateSubject,
    ]).subscribe(([currentsArrays, currentStates]) => {
      this.listLevel = currentsArrays.levelArray.currentLevel;
      this.subLevels = currentsArrays.levelArray.subLevel;
      this.listDashboard = currentsArrays.dashboardArray;
      this.currentLev = currentStates.States.Level;
      this.levelName = currentStates.States.level.label;
      this.superLevel = currentsArrays.levelArray.superLevel;
      this.path = currentStates.States.path;
      this.showselect = this.levelName !== 'National' ;
      this.viewList = this.levelName=='National'? this.listDashboard:this.listLevel;
    });
    // this.blockToShow();
  }
  private blockToShow(list: listDash | listLev) {

  }

  private destroy$: Subject<void> = new Subject<void>();

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  updateBlock(level?: lev, levels?: listLev) {
    if (level) {
      this.filtersState.updateState(undefined, undefined, true);
    }
  }

  updateState(indexLev: number|undefined, indexDash: number|undefined, superLev:boolean|undefined) {
    console.debug('index list', indexDash);
    if (indexLev) {
      this.idLevel=indexLev;
      const elmt = document.getElementById(`pos${indexLev-1}`)
      elmt!.id = "selected"
      this.filtersState.updateState(this.subLevels.id[indexLev - 1]);
    } else if (indexDash) this.filtersState.updateState(undefined, this.listDashboard.id[indexDash]);
  }
  showSub(listLev : listLev){
      this.viewList = listLev
      this.showselect = true 
      // this.filtersState.updateState(this.subLevels.id[1])
  }
  close(){
    this.filtersState.filtersVisible.next(false)
  }
  updateStateClose(indexLev: number|undefined, indexDash: number|undefined, superLev:boolean|undefined){
    this.updateState(indexLev, indexDash, superLev)
    this.close()
  }
}
