import { Injectable } from "@angular/core";
import { AuthService } from "../connection/auth.service";
import { Navigation } from "../middle/Navigation";
import { PDV } from "../middle/Pdv";
import { DataService } from "./data.service";

export type Snapshot = {
  view: boolean;
  year: boolean;
  path?: number[];
  dashboard: number;
  pdv?: number;
  mapVisible: boolean;
  mapFilters?: [number, number[]][];
  widgetParams?: number;
  stayConnected: boolean;
};
export const structureSnapshot: string[] =  ['view', 'year', 'path', 'dashboard', 'pdv', 'mapVisible', 'mapFilters', 'widgetParams', 'stayConnected']



@Injectable({
  providedIn: 'root'
})
export class LoggerService {

  protected snapshot: Snapshot = defaultSnapshot;
  protected change: boolean = false;

  constructor(private dataService: DataService, private navigation: Navigation, private auth: AuthService) {
    //set stay connected as it should be
    this.handleEvent(LoggerService.events.STAY_CONNECTED, auth.getStayConnected());
    this.actionComplete();
  }

  reset() { this.snapshot = defaultSnapshot; }

  handleEvent(event: number, data: any = undefined) {
    let result: any = data, key: string = '';
    switch ( event ) {
      case LoggerService.events.NAVIGATION_TREE_CHANGED:
        key = 'view';
        if ( data.hasTypeOf(PDV.geoTree) )
          result = LoggerService.values.NAVIGATION_GEO_TREE;
        else
          result = LoggerService.values.NAVIGATION_TRADE_TREE;
        break;
      
      case LoggerService.events.NAVIGATION_DASHBOARD_CHANGED:
        key = 'dashboard';
        break;
      
      case LoggerService.events.DATA_YEAR_CHANGED:
        key = 'year';
        break;
      
      case LoggerService.events.PDV_SELECTED:
        key = 'pdv';
        break;
        
      case LoggerService.events.MAP_STATE_CHANGED:
        key = 'mapVisible'
        break;
      
      case LoggerService.events.MAP_FILTERS_CHANGED:
        key = 'mapFilters'
        break;
      
      case LoggerService.events.WIDGET_PARAMS_ADDED:
        key = 'widgetParams'
        break;
      
      case LoggerService.events.WIDGET_PARAMS_REMOVED:
        key = 'widgetParams'
        result = undefined;
        break;
      
      case LoggerService.events.STAY_CONNECTED:
        key = 'stayConnected'
        break;
      
      default:
        console.warn('[LoggerService]: unknown event number', event);
        return key;
    }
    return this.change = this.setValue(key, result);
  }

  setValue(key: string, value: any): boolean {
    let snapshot = this.snapshot as any; //allow indexing
    if ( snapshot[key] === undefined || snapshot[key] != value ) {
      snapshot[key] = value;
      return true;
    }
    return false;
  }

  log() {
    this.autofillFields();
    this.dataService.queueSnapshot(this.snapshot);
    this.dataService.beginUpdateThread()
    this.change = false;
  }

  autofillFields() {
    let path = this.navigation.currentLevel?.path.map(node => node.id) || [];
    this.snapshot.path = path?.slice(1);
  }

  actionComplete() {
    if ( !this.change ) return;
    this.log();
  }

  static events = {
    NAVIGATION_TREE_CHANGED: 0,
    NAVIGATION_PATH_CHANGED: 1,
    NAVIGATION_DASHBOARD_CHANGED: 2,
    DATA_YEAR_CHANGED: 3,
    PDV_SELECTED: 4,
    MAP_STATE_CHANGED: 5,
    MAP_FILTERS_CHANGED: 6,
    WIDGET_PARAMS_ADDED: 7,
    WIDGET_PARAMS_REMOVED: 8,
    STAY_CONNECTED: 9
  };

  static values = {
    NAVIGATION_GEO_TREE: false,
    NAVIGATION_TRADE_TREE: true,
    DATA_YEAR_CURRENT: true,
    DATA_YEAR_LAST: false
  };
}

const defaultSnapshot: Snapshot = {
  view: LoggerService.values.NAVIGATION_GEO_TREE,
  year: LoggerService.values.DATA_YEAR_CURRENT,
  dashboard: 1,
  mapVisible: false,
  widgetParams: undefined,
  stayConnected: false
};