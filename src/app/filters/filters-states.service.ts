import { DataService } from './../services/data.service';
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';
import { Injectable, OnDestroy } from '@angular/core';
import DEH, { NavigationExtractionHelper } from '../middle/DataExtractionHelper';
import { Navigation } from '../middle/Navigation';
import { getGeoTree, loadAll, PDV, SliceDice } from '../middle/Slice&Dice';
import { Tree } from '../middle/Node';
import { AsyncSubject, Subject, Subscription } from 'rxjs';
import { LoggerService } from '../behaviour/logger.service';
import { debounceTime } from 'rxjs/operators';

@Injectable()
export class FiltersStatesService implements OnDestroy {
  currentlevelName: string = '';
  filtersVisible = new BehaviorSubject<boolean>(false);
  subscription?: Subscription;

  constructor(public navigation: Navigation, private dataservice : DataService, private sliceDice: SliceDice, private logger: LoggerService) {
    console.log('[FiltersStates]: On.')
    this.subscription = this.dataservice.response.subscribe((data) => {
      if (data) {
        DEH.setData(data);
        loadAll();
        this.reset(getGeoTree(), true);
      }
    });

    this.pathChanged.pipe(debounceTime(5000)).subscribe(() => {
      this.logger.log();
    });

    (window as any).refresh = () => { this.dataservice.update.next(); }
  }

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
    this.sliceDice.geoTree = t.type == NavigationExtractionHelper;
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

  reload() {
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

    this.sliceDice.geoTree = this.navigation.tree!.type == NavigationExtractionHelper;
    this.stateSubject.next(currentState);
    this.arraySubject.next(currentArrays);
  }

  gotoPDVsDashboard() {
    if ( this.navigation.currentDashboard!.name.indexOf('Points de Vente') >= 0 )
      return true;
    
    let change = this.navigation.gotoPDVsDashboard();
    if ( !change ) return false;
    this.logger.handleEvent(LoggerService.events.NAVIGATION_DASHBOARD_CHANGED, this.navigation.currentDashboard!.id);
    this.logger.actionComplete();

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
    return true;
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
      this.reset(this.navigation.tree!.type == NavigationExtractionHelper ? PDV.geoTree : PDV.tradeTree, true);
      this.dataservice.update.next();
    }
  }

  navigateUp(index: number) {
    if ( !index ) return;

    this.navigation.navigateUp(index);
    const currentArrays = {
      levelArray: this.navigation.getArray('level'),
      dashboardArray: this.navigation.getArray('dashboard'),
    };
    const States = this.navigation.getCurrent();
    const currentState = {
      States
    };
    this.stateSubject.next(currentState);
    this.arraySubject.next(currentArrays);
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe();
  }
}
