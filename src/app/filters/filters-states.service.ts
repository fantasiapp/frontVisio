import { DataService } from './../services/data.service';
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';
import { Injectable } from '@angular/core';
import { MOCK_NAVIGATION } from '../structure/mock-structure';
import DataExtractionHelper from '../sliceDice/DataExtractionHelper';
import {Navigation} from '../sliceDice/Navigation';
//!!!HACK
import { load } from '../sliceDice/Slice&Dice';

import { state } from '@angular/animations';
import {MatSelectModule} from '@angular/material/select'
import { Subject } from 'rxjs';

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
        DataExtractionHelper.setData(data);
        //HACK!!
        this.navigation.load(load());
        const currentArrays = {
          levelArray: this.navigation.getArray('level'),
          dashboardArray: this.navigation.getArray('dashboard'),
        };
        const currentState = {
          States: this.navigation.getCurrent(),
        };

        this.stateSubject.next(currentState);
        this.arraySubject.next(currentArrays);}
        this.$path.next({});
    });

  }


  $path: BehaviorSubject<{}> = new BehaviorSubject({});

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
        grid: ["1", "1"] as [string, string],
        areas: {x: null},
        template: 'x',
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
    this.arraySubject.next(currentArrays);
    
    if ( this.navigation.currentLevel ) {
      let path = this.navigation.getCurrent()._path.slice(1).reduce((acc: {[key:string]:number}, level: [string, number], idx: number) => {
        if ( idx == 0 )
          acc['Région'] = level[1]
        else acc[level[0]]=level[1];
        return acc;
      }, {});

      this.$path.next(path);
    }
  }
}
