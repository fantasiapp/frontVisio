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
  started: boolean = false;

  constructor(public navigation: Navigation, private dataservice : DataService, private sliceDice: SliceDice, private logger: LoggerService) {
    super();
    //console.log('[FiltersStates]: On.');
    this.subscribe(this.dataservice.response, (data) => {
      if (data) {
        DEH.setData(data);
        PDV.load(true);
        if ( this.started )
          this.setTree(this.tree!.hasTypeOf(PDV.geoTree) ? PDV.geoTree : PDV.tradeTree, true);
        else
          this.setTree(PDV.geoTree, true);
        this.started = true;
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
    this._state = this.navigation.getState();
    this.state.next(this._state);
  }

  getState() { return this.navigation.getState(); }

  logPathChanged: Subject<{}> = new Subject;

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

    if ( dashboardId ) {
      this.logger.handleEvent(LoggerService.events.NAVIGATION_DASHBOARD_CHANGED, this.navigation.currentDashboard!.id);
      this.logger.actionComplete();
    }

    if ( emit )
      this.emitEvents();
  }

  get tree() { return this.navigation.tree; }

  public setTree(tree: Tree, follow: boolean = true) {
    if ( follow )
      this.navigation.followTree(tree);
    else
      this.navigation.setTree(tree);
    
    this.update();
  }

  update() {
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

  navigateUp(height: number) {
    if ( !height ) return;
    this.navigation.navigateUp(height);
    this.emitEvents();
  }

  setYear(current: boolean) {
    DEH.currentYear = current;
    let change = this.logger.handleEvent(LoggerService.events.DATA_YEAR_CHANGED, current);
    this.logger.actionComplete();
    if ( change ) {
      PDV.load(true);
      this.setTree(this.tree?.hasTypeOf(PDV.geoTree) ? PDV.geoTree : PDV.tradeTree, true);
      this.dataservice.update.next();
    }
  }

  emitEvents() {
    this.emitState();
    this.emitFilters();
  }
}