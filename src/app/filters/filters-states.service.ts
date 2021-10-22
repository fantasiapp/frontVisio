import { DataService } from './../services/data.service';
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';
import { Injectable, OnDestroy } from '@angular/core';
import DataExtractionHelper, { NavigationExtractionHelper } from '../middle/DataExtractionHelper';
import { Navigation } from '../middle/Navigation';
import { getGeoTree, loadAll, PDV, SliceDice } from '../middle/Slice&Dice';
import { Tree } from '../middle/Node';
import { AsyncSubject, Subject, Subscription } from 'rxjs';
import { LoggerService } from '../behaviour/logger.service';
import { debounceTime } from 'rxjs/operators';
import { LocalStorageService } from '../services/local-storage.service';

@Injectable()
export class FiltersStatesService implements OnDestroy {
  currentlevelName: string = '';
  filtersVisible = new BehaviorSubject<boolean>(false);
  tree?: Tree;
  subscription?: Subscription;

  constructor(private navigation: Navigation, private dataservice : DataService, private sliceDice: SliceDice, private logger: LoggerService, private localStorageService: LocalStorageService) {
    console.log('[FiltersStates]: On.')
    this.subscription = this.dataservice.response.subscribe((data) => {
      if (data) {
        DataExtractionHelper.setData(data);
        loadAll();
        this.reset(getGeoTree(), true);
        this.$load.next(0 as never);
        this.$load.complete();
        if(this.localStorageService.getToken()) this.dataservice.beginUpdateThread();
      }
    });

    this.pathChanged.pipe(debounceTime(5000)).subscribe(() => {
      this.logger.log();
    });
  }

  $load: AsyncSubject<never> = new AsyncSubject();
  pathChanged: Subject<never> = new Subject;

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

    if ( superlevel !== undefined || levelId !== undefined ) {
      this.pathChanged.next();
    }

    if ( dashboardId ) {
      this.logger.handleEvent(LoggerService.events.NAVIGATION_DASHBOARD_CHANGED, States.dashboard.id);
      this.logger.actionComplete();
    }

    if ( emit ) {
      this.stateSubject.next(currentState);
      this.arraySubject.next(currentArrays);
    }
  }

  getPath(States: any) {
    let path = States._path.slice(1).reduce((acc: {[key:string]:number}, level: [string, number], idx: number) => {
      acc[level[0]]=level[1];
      return acc;
    }, {});
    return path;
  }

  public reset(t: Tree, follow: boolean = true) {
    this.tree = t;
    this.sliceDice.geoTree = this.tree!.type == NavigationExtractionHelper;
    if ( follow )
      this.navigation.followTree(t);
    else
      this.navigation.setTree(t);

    const currentArrays = {
      levelArray: this.navigation.getArray('level'),
      dashboardArray: this.navigation.getArray('dashboard'),
    };
    let States = this.navigation.getCurrent(), path = this.getPath(States);
    const currentState = {
      States
    };

    this.logger.handleEvent(LoggerService.events.NAVIGATION_TREE_CHANGED, t);
    this.logger.handleEvent(LoggerService.events.NAVIGATION_DASHBOARD_CHANGED, States.dashboard.id);
    this.logger.actionComplete();
    this.stateSubject.next(currentState);
    this.arraySubject.next(currentArrays);
  }

  //this makes GridManager.refresh a bit silly
  //as it refreshes almost everything and is easily accessible
  refresh() {
    const currentArrays = {
      levelArray: this.navigation.getArray('level'),
      dashboardArray: this.navigation.getArray('dashboard'),
    };
    let States = this.navigation.getCurrent();
    const currentState = {
      States
    };

    this.logger.handleEvent(LoggerService.events.NAVIGATION_TREE_CHANGED, this.navigation.tree);
    this.logger.handleEvent(LoggerService.events.NAVIGATION_DASHBOARD_CHANGED, States.dashboard.id);
    this.logger.actionComplete();

    this.tree = this.navigation.tree;
    this.sliceDice.geoTree = this.tree!.type == NavigationExtractionHelper;
    this.stateSubject.next(currentState);
    this.arraySubject.next(currentArrays);
  }

  canSub() {
    return this.arraySubject.value.levelArray.subLevel.id.length && this.navigation.childrenHaveSameDashboard();
  }

  setYear(current: boolean) {
    this.navigation.setCurrentYear(current);
    let change = this.logger.handleEvent(LoggerService.events.DATA_YEAR_CHANGED, current);
    this.logger.actionComplete();
    if ( change ) {
      loadAll();
      this.reset(this.tree!.type == NavigationExtractionHelper ? PDV.geoTree : PDV.tradeTree, true);
      this.dataservice.update.next();
    }
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe();
    console.log('filtersState destroyed');
  }
}
