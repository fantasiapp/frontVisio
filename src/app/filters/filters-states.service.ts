import { DataService } from './../services/data.service';
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';
import { Injectable, OnDestroy, Pipe, PipeTransform } from '@angular/core';
import DEH, { Params } from '../middle/DataExtractionHelper';
import { Navigation } from '../middle/Navigation';
import { SliceDice } from '../middle/Slice&Dice';
import { PDV } from '../middle/Pdv';
import { Node, Tree } from '../middle/Node';
import { Subject } from 'rxjs';
import { LoggerService } from '../behaviour/logger.service';
import { debounceTime } from 'rxjs/operators';
import Dashboard from '../middle/Dashboard';
import { SubscriptionManager } from '../interfaces/Common';

@Injectable()
export class FiltersStatesService extends SubscriptionManager {
  currentlevelName: string = '';
  filtersVisible = new BehaviorSubject<boolean>(false);

  constructor(public navigation: Navigation, private dataservice : DataService, private sliceDice: SliceDice, private logger: LoggerService) {
    super();
    console.log('[FiltersStates]: On.');
    this.subscribe(this.dataservice.response, (data) => {
      if (data) {
        DEH.setData(data);
        PDV.load(true);
        this.setTree(PDV.geoTree, true);
      }
    });

    this.logPathChanged.pipe(debounceTime(5000)).subscribe(() => {
      this.logger.log();
    });
  }

  private _state?: {node: Node; dashboard: Dashboard};
  state = new Subject<{node: Node; dashboard: Dashboard}>();

  filters = new Subject<{
    dashboard: Dashboard,
    path: Node[],
    listLevel: Node[],
    listDashboards: Dashboard[],
    level: Node,
    superLevel: Node | null,
    subLevels: Node[]
  }>();

  emitFilters() {
    let {node, dashboard} = this._state!;
    
    this.filters.next({
      dashboard,
      path: node.path,
      listLevel: this.navigation.sort(node.siblings),
      listDashboards: node.dashboards,
      level: node,
      superLevel: node.parent,
      subLevels: this.navigation.getNodeChildren(node)
    });
  }

  emitState() {
    this.state.next(this._state!);
  }

  getState() { return this.navigation.getState(); }

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

  getYear() {
    let year = Params.currentYear;
    return DEH.currentYear ? year : year - 1;
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
      this.logPathChanged.next(this._state!.node.path);

    this._state = this.navigation.getState();
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
    
    this._state = this.navigation.getState();
    this.logger.handleEvent(LoggerService.events.NAVIGATION_TREE_CHANGED, t);
    this.logger.handleEvent(LoggerService.events.NAVIGATION_DASHBOARD_CHANGED, this.navigation.currentDashboard!.id);
    this.logger.actionComplete();
    this.emitEvents();
  }

  refresh() {
    this._state = this.navigation.getState();
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
    this._state = this.navigation.getState();
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
    const States = this.navigation.getCurrent();
    const currentState = {
      States
    };
    this.stateSubject.next(currentState);
    this.emitFilters();
    this.emitState();
  }

  navigateUp(height: number) {
    if ( !height ) return;
    this.navigation.navigateUp(height);
    this._state = this.navigation.getState();
    this.emitEvents();
  }
}