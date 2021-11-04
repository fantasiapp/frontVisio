import { DataService } from './../services/data.service';
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';
import { Injectable, OnDestroy } from '@angular/core';
import DEH, { Params, TreeExtractionHelper } from '../middle/DataExtractionHelper';
import { Navigation } from '../middle/Navigation';
import { PDV, SliceDice } from '../middle/Slice&Dice';
import { Tree } from '../middle/Node';
import { Subject, Subscription } from 'rxjs';
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
        PDV.load(true);
        this.setTree(PDV.geoTree, true);
      }
    });

    this.logPathChanged.pipe(debounceTime(5000)).subscribe((path) => {
      this.logger.log();
    });
  }

  logPathChanged: Subject<{}> = new Subject;
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

  getYear() {
    let year = Params.currentYear;
    return (DEH.currentYear ? year : year - 1).toString();
  }

  getMonth(): string {
    return Params.currentMonth;
  }

  updateState(
    levelId?: number,
    dashboardId?: number,
    superlevel?: boolean,
    emit: boolean = true
  ) {

    this.navigation.setCurrent(levelId, dashboardId, superlevel);
    if ( superlevel !== undefined || levelId !== undefined )
      this.logPathChanged.next(this.currentPath);

    if ( dashboardId ) {
      this.logger.handleEvent(LoggerService.events.NAVIGATION_DASHBOARD_CHANGED, this.navigation.currentDashboard!.id);
      this.logger.actionComplete();
    }

    if ( emit )
      this.emitEvents();
  }

  getPath(States: any) {
    let path = States._path.slice(1).reduce((acc: {[key:string]:number}, level: [string, number], idx: number) => {
      acc[level[0]]=level[1];
      return acc;
    }, {});
    return path;
  }

  get currentPath() { return this.getPath(this.stateSubject.value.States); }
  get tree() { return this.navigation.tree; }

  public setTree(t: Tree, follow: boolean = true) {
    this.sliceDice.geoTree = t.hasTypeOf(PDV.geoTree);
    if ( follow )
      this.navigation.followTree(t);
    else
      this.navigation.setTree(t);
    
    this.logger.handleEvent(LoggerService.events.NAVIGATION_TREE_CHANGED, t);
    this.logger.handleEvent(LoggerService.events.NAVIGATION_DASHBOARD_CHANGED, this.navigation.currentDashboard!.id);
    this.logger.actionComplete();
    this.emitEvents();
  }

  refresh() {
    this.logger.handleEvent(LoggerService.events.NAVIGATION_TREE_CHANGED, this.tree);
    this.logger.handleEvent(LoggerService.events.NAVIGATION_DASHBOARD_CHANGED, this.navigation.currentDashboard!.id);
    this.logger.actionComplete();

    this.sliceDice.geoTree = this.tree?.hasTypeOf(PDV.geoTree) || false;
    this.emitEvents();
  }

  gotoPDVsDashboard() {
    if ( this.navigation.currentDashboard!.name.indexOf('Points de Vente') >= 0 )
      return true;
    
    let change = this.navigation.gotoPDVsDashboard();
    if ( !change ) return false;
    this.logger.handleEvent(LoggerService.events.NAVIGATION_DASHBOARD_CHANGED, this.navigation.currentDashboard!.id);
    this.logger.actionComplete();
    this.emitEvents();
    return true;
  }

  canSub() {
    return this.navigation.childrenHaveSameDashboard();
  }

  setYear(current: boolean) {
    DEH.currentYear = current;
    let change = this.logger.handleEvent(LoggerService.events.DATA_YEAR_CHANGED, current);
    this.logger.actionComplete();
    console.log(change);
    if ( change ) {
      PDV.load(true);
      this.setTree(this.tree?.hasTypeOf(PDV.geoTree) ? PDV.geoTree : PDV.tradeTree, true);
      this.dataservice.update.next();
    }
  }

  emitEvents() {
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

  navigateUp(quantity: number) {
    if ( !quantity ) return;
    this.navigation.navigateUp(quantity);
    this.emitEvents();
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe();
  }
}
