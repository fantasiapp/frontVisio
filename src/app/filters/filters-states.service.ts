import { DataService } from './../services/data.service';
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';
import { Injectable } from '@angular/core';
import { MOCK_NAVIGATION } from '../structure/mock-structure';
import {Navigation} from '../navigation/Navigation';
import { state } from '@angular/animations';
import {MatSelectModule} from '@angular/material/select'

@Injectable({
  providedIn: 'root',
})
export class FiltersStatesService {
  currentlevelName: string = '';
  filtersVisible = new BehaviorSubject<boolean>(false);
  
  constructor(private navigation: Navigation, private dataservice : DataService) {
    this.dataservice.response.subscribe((data) => {
      if (data){
        console.debug('les datas ', data);
        this.navigation.setData(data);
        const currentArrays = {
          levelArray: this.navigation.getArray('level'),
          dashboardArray: this.navigation.getArray('dashboard'),
        };
        const currentState = {
          States: this.navigation.getCurrent(),
        };
        this.stateSubject.next(currentState);
        this.arraySubject.next(currentArrays);}
    });

  }

  stateSubject = new BehaviorSubject({
    States: {
      level:{
        id : 0,
        name: '',
        label:'',
      },
      dashboard: {
        id: 0,
        name: '',
      },
      path: []
    },
  });
  arraySubject = new BehaviorSubject({
    levelArray: {
    currentLevel: {
      name: [],
      id: [],
      label: [],
    },
    subLevel: {
      name: [],
      id: [],
      label: [],
    },
    superLevel: {
      name:'',
      id: 0,
      label: '',
    }},
    dashboardArray: {
      id: [],
      name: [],      
    },
  });

  public updateState(
    levelId?: number,
    dashboardId?: number,
    superlevel?: boolean
  ) {
    this.navigation.setCurrent(levelId, dashboardId, superlevel);
    const currentArrays = {
      levelArray: this.navigation.getArray('level'),
      dashboardArray: this.navigation.getArray('dashboard'),
    };
    const currentState = {
      States: this.navigation.getCurrent(),
    };
    this.stateSubject.next(currentState);
    this.arraySubject.next(currentArrays)
  }
}
