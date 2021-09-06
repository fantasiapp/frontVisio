import { FormsModule } from '@angular/forms';
import { FiltersStatesService } from './filters-states.service';
import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { ThrowStmt } from '@angular/compiler';
import { Subject } from 'rxjs/internal/Subject';
import { combineLatest } from 'rxjs';
import Dashboard from '../navigation/Dashboard';

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
  label: string;
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
  showselect: boolean = false;
  path: string = '';
  idLevel: number = 0;
  selectedDashboardId: number = 4;
  selectedDashboardName: string = '';
  ngOnInit(): void {
    combineLatest([
      this.filtersState.arraySubject,
      this.filtersState.stateSubject,
    ]).subscribe(([currentsArrays, currentStates]) => {
      this.listLevel = currentsArrays.levelArray.currentLevel;
      this.subLevels = currentsArrays.levelArray.subLevel;
      this.currentLev = currentStates.States.Level;
      this.listDashboard = currentsArrays.dashboardArray;
      this.levelName = currentStates.States.level.name;
      this.superLevel = currentsArrays.levelArray.superLevel;
      this.path = currentStates.States.path;
      this.showselect = this.levelName !== 'France';
      this.selectedDashboardId = currentStates.States.dashboard.id;
      this.selectedDashboardName = currentStates.States.dashboard.name;
    });
    this.viewList =
      this.levelName == 'France' ? this.listDashboard : this.listLevel;
  }
  private blockToShow(list: listDash | listLev) {}

  private destroy$: Subject<void> = new Subject<void>();

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  showSuper(level?: lev, levels?: listLev) {
    this.filtersState.updateState(undefined, undefined, true);
    this.viewList =
      this.levelName == 'France' ? this.listDashboard : this.listLevel;
  }

  updateState(
    indexLev: number | undefined,
    indexDash: number | undefined,
    superLev: boolean | undefined
  ) {
    if (indexLev) {
      if (this.viewList === this.subLevels) {
        this.filtersState.updateState(
          this.subLevels.id[indexLev - 1],
          undefined,
          undefined
        );
      } else if (this.viewList.name[0] === this.listLevel.name[0]) {
        this.filtersState.updateState(undefined, undefined, true);
        this.filtersState.updateState(
          this.viewList.id[indexLev - 1],
          undefined,
          undefined
        );
      }
    } else if (indexDash)
      this.filtersState.updateState(undefined, indexDash, undefined);
  }
  showSub(listSub: listLev) {
    this.viewList = listSub;
    this.showselect = true;
  }
  close() {
    this.filtersState.filtersVisible.next(false);
  }
  updateStateClose(
    indexLev: number | undefined,
    indexDash: number | undefined,
    superLev: boolean | undefined
  ) {
    this.updateState(indexLev, indexDash, superLev);
    this.close();
  }
}
