import { DataService } from './../services/data.service';
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';
import { Injectable } from '@angular/core';
import { MOCK_NAVIGATION } from '../structure/mock-structure';
import Navigation from '../navigation/Navigation';
import { state } from '@angular/animations';

@Injectable({
  providedIn: 'root',
})
export class FiltersStatesService {
  currentlevelName: string = '';
  filtersVisible = new BehaviorSubject<boolean>(false)
  
  stateSubject = new BehaviorSubject({
    States: Navigation.getCurrent(),
  });
  arraySubject = new BehaviorSubject({
    levelArray: Navigation.getArray('level'),
    dashboardArray: Navigation.getArray('dashboard'),
  });

  constructor() {
  }
  public updateState(
    levelId?: number,
    dashboardId?: number,
    superlevel?: boolean
  ) {
    Navigation.setCurrent(levelId , dashboardId, superlevel);
    const currentArrays = {
      levelArray: Navigation.getArray('level'),
      dashboardArray: Navigation.getArray('dashboard'),
    };
    const currentState = {
      States: Navigation.getCurrent(),
    };
    this.stateSubject.next(currentState);
    this.arraySubject.next(currentArrays);
  }
}
