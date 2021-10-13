import { Injectable } from "@angular/core";
import { PDV } from "../middle/Slice&Dice";
import { DataService } from "../services/data.service";

export type Snapshot = {
  view: number;
  year: number;
  path: number[];
  dashboard: number;
  pdv?: number;
  mapVisible: boolean;
  mapFilters?: [number, number[]][];
  targetControl: boolean;
  connected: boolean;
};

@Injectable({
  providedIn: 'root'
})
export class LoggerService {

  private snapshot: Snapshot = defaultSnapshot;

  constructor(private dataService: DataService) {
    (window as any).logger = this;
  }

  reset() {
    this.snapshot = defaultSnapshot;
  }

  handleEvent(event: number, data: any = undefined) {
    switch ( event ) {
      case LoggerService.events.NAVIGATION_TREE_CHANGED:
        if ( data.type == PDV.geoTree.type )
          this.snapshot.view = LoggerService.values.NAVIGATION_GEO_TREE;
        else
          this.snapshot.view = LoggerService.values.NAVIGATION_TRADE_TREE;
        break;
      
      case LoggerService.events.NAVIGATION_PATH_CHANGED:
        this.snapshot.path = (data as number[])
        break;
      
      case LoggerService.events.NAVIGATION_DASHBOARD_CHANGED:
        this.snapshot.dashboard = (data as number);
        break;
      
      case LoggerService.events.DATA_YEAR_CHANGED:
        this.snapshot.year = data;
        break;
      
      case LoggerService.events.PDV_SELECTED:
        this.snapshot.pdv = data;
        break;
        
      case LoggerService.events.MAP_STATE_CHANGED:
        this.snapshot.mapVisible = data;
        break;
      
      case LoggerService.events.MAP_FILTERS_CHANGED:
        this.snapshot.mapFilters = data;
        break;
      
      case LoggerService.events.TARGET_CONTROL_OPENED:
        this.snapshot.targetControl = data;
        break;
      
      case LoggerService.events.DISCONNECT:
        this.snapshot.connected = data;
        break;
      
      default:
        console.warn('[LoggerService]: unknown event number', event);
        break;
    }
  }

  actionComplete() {
    this.dataService.queueSnapshot(this.snapshot)
  }

  static events = {
    NAVIGATION_TREE_CHANGED: 0,
    NAVIGATION_PATH_CHANGED: 1,
    NAVIGATION_DASHBOARD_CHANGED: 2,
    DATA_YEAR_CHANGED: 3,
    PDV_SELECTED: 4,
    MAP_STATE_CHANGED: 5,
    MAP_FILTERS_CHANGED: 6,
    TARGET_CONTROL_OPENED: 7,
    DISCONNECT: 8
  };

  static values = {
    NAVIGATION_GEO_TREE: 0,
    NAVIGATION_TRADE_TREE: 1,
    DATA_YEAR_CURRENT: 1,
    DATA_YEAR_LAST: 0
  };
}

const defaultSnapshot: Snapshot = {
  view: LoggerService.values.NAVIGATION_GEO_TREE,
  year: LoggerService.values.DATA_YEAR_CURRENT,
  path: [],
  dashboard: 0,
  mapVisible: false,
  mapFilters: [],
  targetControl: false,
  connected: true
};