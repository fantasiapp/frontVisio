import { DataService } from './../services/data.service';
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';
import { Injectable } from '@angular/core';
import DataExtractionHelper from '../middle/DataExtractionHelper';
import { Navigation } from '../middle/Navigation';
import { loadAll, getGeoTree, PDV } from '../middle/Slice&Dice';
import { Tree } from '../middle/Node';
import { AsyncSubject } from 'rxjs';

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
        this.$load.next(0 as never);
        this.$load.complete();
        this.dataservice.beginUpdateThread();
      }
    });

    this.dataservice.update.subscribe((_) => {
      let type = this.navigation.tree?.type || null;
      //doesn't notify further because it's not needed
      this.navigation.setTree(PDV.geoTree.type == type ? PDV.geoTree : PDV.tradeTree);
    });
  }


  $path: BehaviorSubject<{}> = new BehaviorSubject({});
  $load: AsyncSubject<never> = new AsyncSubject();

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
      

      if ( emit )
        this.$path.next(this.getPath(currentState.States));
    }
  }

  private getPath(States: any) {
    let path = States._path.slice(1).reduce((acc: {[key:string]:number}, level: [string, number], idx: number) => {
      acc[level[0]]=level[1];
      return acc;
    }, {});
    return path;
  }

  public reset(t: Tree) {
    this.tree = t;
    this.navigation.setTree(t);
    const currentArrays = {
      levelArray: this.navigation.getArray('level'),
      dashboardArray: this.navigation.getArray('dashboard'),
    };
    let States = this.navigation.getCurrent();
    const currentState = {
      States
    };
    this.stateSubject.next(currentState);
    this.arraySubject.next(currentArrays);
    this.$path.next(this.getPath(States));
  }

  canSub() {
    return this.arraySubject.value.levelArray.subLevel.id.length && this.navigation.childrenHaveSameDashboard();
  }
}
