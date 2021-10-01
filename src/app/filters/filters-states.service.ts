import { DataService } from './../services/data.service';
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';
import { Injectable } from '@angular/core';
import DataExtractionHelper from '../middle/DataExtractionHelper';
import { Navigation } from '../middle/Navigation';
import { loadAll, getGeoTree } from '../middle/Slice&Dice';
import { Tree } from '../middle/Node';

@Injectable({
  providedIn: 'root',
})
export class FiltersStatesService {
  currentlevelName: string = '';
  filtersVisible = new BehaviorSubject<boolean>(false);
  tree?: Tree;
  constructor(private navigation: Navigation, private dataservice : DataService) {
    this.dataservice.response.subscribe((data) => {
      if (data) {
        DataExtractionHelper.setData(data);
        loadAll();
        let defaultTree = getGeoTree();
        this.reset(defaultTree);
      }
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
        description: ''
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

  public getYear() {
    return this.navigation.getCurrentYear();
  };

  public updateState(
    levelId?: number,
    dashboardId?: number,
    superlevel?: boolean,
    emit: boolean = true
  ) {
    this.navigation.setCurrent(levelId, dashboardId, superlevel);
    const currentArrays = {
      levelArray: this.navigation.getArray('level'),
      dashboardArray: this.navigation.getArray('dashboard'),
    };
    const currentState = {
      States: this.navigation.getCurrent(),
    };

    if ( emit )
      this.stateSubject.next(currentState);
      this.arraySubject.next(currentArrays);
    
    if ( this.navigation.currentLevel ) {
      /* Rework this */
      let path = this.navigation.getCurrent()._path.slice(1).reduce((acc: {[key:string]:number}, level: [string, number], idx: number) => {
        acc[level[0]]=level[1];
        return acc;
      }, {});

      if ( emit )
        this.$path.next(path);
    }
  }

  public reset(t: Tree) {
    this.tree = t;
    this.navigation.setTree(t);
    const currentArrays = {
      levelArray: this.navigation.getArray('level'),
      dashboardArray: this.navigation.getArray('dashboard'),
    };
    const currentState = {
      States: this.navigation.getCurrent(),
    };
    this.stateSubject.next(currentState);
    this.arraySubject.next(currentArrays);
    this.$path.next({});
  }

  canSub() {
    return this.arraySubject.value.levelArray.subLevel.id.length && this.navigation.childrenHaveSameDashboard();
  }
}
