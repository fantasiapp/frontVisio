import { DataService } from './../services/data.service';
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';
import { Injectable } from '@angular/core';
import DataExtractionHelper from '../middle/DataExtractionHelper';
import { Navigation } from '../middle/Navigation';
import { getGeoTree, loadAll, PDV } from '../middle/Slice&Dice';
import { Tree } from '../middle/Node';
import { AsyncSubject } from 'rxjs';
import { LoggerService } from '../behaviour/logger.service';

@Injectable({
  providedIn: 'root'
})
export class FiltersStatesService {
  currentlevelName: string = '';
  filtersVisible = new BehaviorSubject<boolean>(false);
  tree?: Tree;
  constructor(private navigation: Navigation, private dataservice : DataService, private logger: LoggerService) {
    this.dataservice.response.subscribe((data) => {
      if (data) {
        DataExtractionHelper.setData(data);
        loadAll();
        this.reset(getGeoTree(), false);
        this.$load.next(0 as never);
        this.$load.complete();
        this.dataservice.beginUpdateThread();
      }
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
    const States = this.navigation.getCurrent();
    const currentState = {
      States
    };

    //the path is auto computed, the only interesting thing "logwise" that can change is the dashboard
    console.log('filtersState.updateState')
    this.logger.handleEvent(LoggerService.events.NAVIGATION_DASHBOARD_CHANGED, States.dashboard.id);
    this.logger.actionComplete();

    if ( emit ) {
      this.stateSubject.next(currentState);
      this.arraySubject.next(currentArrays);
      this.$path.next(this.getPath(currentState.States));
    }
    // if ( this.navigation.currentLevel ) {
    //   /* Rework this */
    //   if ( emit )
    //     this.$path.next(this.getPath(currentState.States));
    // }
  }

  private getPath(States: any) {
    let path = States._path.slice(1).reduce((acc: {[key:string]:number}, level: [string, number], idx: number) => {
      acc[level[0]]=level[1];
      return acc;
    }, {});
    return path;
  }

  public reset(t: Tree, follow: boolean = true) {
    this.tree = t;
    if ( follow )
      this.navigation.followTree(t);
    else
      this.navigation.setTree(t);

    const currentArrays = {
      levelArray: this.navigation.getArray('level'),
      dashboardArray: this.navigation.getArray('dashboard'),
    };
    let States = this.navigation.getCurrent();
    const currentState = {
      States
    };

    this.logger.handleEvent(LoggerService.events.NAVIGATION_TREE_CHANGED, t);
    this.logger.handleEvent(LoggerService.events.NAVIGATION_DASHBOARD_CHANGED, States.dashboard.id);
    this.logger.actionComplete();
    this.stateSubject.next(currentState);
    this.arraySubject.next(currentArrays);
    this.$path.next(this.getPath(States));
  }

  canSub() {
    return this.arraySubject.value.levelArray.subLevel.id.length && this.navigation.childrenHaveSameDashboard();
  }
}
