import DataExtractionHelper, {NavigationExtractionHelper, TradeExtrationHelper} from './DataExtractionHelper';
import Dashboard from './Dashboard';
import {Injectable} from '@angular/core';
import {Tree, Node} from './Node';
import { PDV } from './Slice&Dice';
import { LoggerService } from '../behaviour/logger.service';

@Injectable()
export class Navigation{
  tree?: Tree;
  currentLevel?: Node;
  currentDashboard?: Dashboard;

  constructor(private logger: LoggerService) {}

  setTree(t: Tree){
    let path = this.currentLevel ? this.currentLevel.path.slice(1).map(level => level.id) : null, dashboardIndex: number, sameType = this.tree?.type === t.type;
    if ( path )
      dashboardIndex = this.currentLevel!.dashboards.findIndex(dashboard => dashboard.id == this.currentDashboard?.id);

    this.tree = t ? t : new Tree(NavigationExtractionHelper);
    this.currentLevel = this.tree.root;
    this.currentDashboard = this.currentLevel!.dashboards[0];

    if ( sameType && path  ) {
      for ( let id of path )
        this.currentLevel = this.currentLevel!.goChild(id);
      
      this.currentDashboard = this.currentLevel!.dashboards[dashboardIndex!] || this.currentLevel?.dashboards[0];
    }

    this.logger.handleEvent(LoggerService.events.NAVIGATION_TREE_CHANGED, t);
    this.logger.handleEvent(LoggerService.events.NAVIGATION_PATH_CHANGED, this.currentLevel.path.map((node: Node) => node.id));
    this.logger.handleEvent(LoggerService.events.NAVIGATION_DASHBOARD_CHANGED, this.currentDashboard.id);
  }

  getArray(dataType: 'level' | 'dashboard'): any{
    let currentLevel = this.currentLevel!
    if (dataType == 'level'){
      //dont navigate pdv
      let subLevel = (!this.childIsPdv(currentLevel)) ? {
        name: currentLevel.children.map((child: any) => child.name),
        id: currentLevel.children.map((child: any) => child.id),
        label: currentLevel.children.map((child: any) => child.label),
      }: {name: [], id: [], label:[]};

      let superLevel = (currentLevel.parent && !currentLevel.parent.parent) ? {
        name: 'National', id: 0, label: 'National'
      } : {name: currentLevel.parent?.name, id: currentLevel.parent?.id, label: currentLevel.parent?.label};


      return {
        currentLevel: {
          name: currentLevel.siblings.map((sibling: any) => sibling.name),
          id: currentLevel.siblings.map((sibling: any) => sibling.id),
          label: currentLevel.children.map((child: any) => child.label),
        },
        subLevel,
        superLevel,
      };
    
    } else{
      return{
        id: currentLevel.dashboards.map((dashboard) => dashboard.id),
        name: currentLevel.dashboards.map((dashboard) => dashboard.name),
      };
    }
  }

  private childIsPdv(child: Node): boolean{
    return <boolean>(child.children.length && child.children[0] instanceof PDV);
  }

  getCurrent(): any{
    let currentLevel = this.currentLevel!
    let currentDashboard = this.currentDashboard!
    return {
      level: {
        id: currentLevel.id,
        name: currentLevel.name,
        label: currentLevel.label,
      },
      dashboard: {
        id: currentDashboard.id,
        name: currentDashboard.name,
        description: currentDashboard.description,
        grid: currentDashboard.grid,
        template: currentDashboard.template,
        areas: currentDashboard.areas
      },
      path: currentLevel.path.map(
        (level) => level.label +': '+ level.name 
      ),
      _path: currentLevel.path.map(
        (level) => [level.label, level.id] 
      )
    };
  }

  isTopLevel(){
    return this.currentLevel?.parent;
  }

  childrenHaveSameDashboard(): boolean {
    let dashboardId = this.currentDashboard!.id;
    let child = this.currentLevel!.children[0];
    if ( child instanceof PDV ) return false;
    let nextDashboard = child.dashboards.find(
      (dashboard) => dashboard.id == dashboardId
    );
    return nextDashboard ? true : false;
  }

  setCurrent(
    levelId?: number,
    dashboardId?: number,
    superLevel?: boolean
  ){
    let currentLevel = this.currentLevel!
    let currentDashboard = this.currentDashboard!
    if (superLevel){
      let dashboardId = currentDashboard.id,
        nextDashboard;
      this.currentLevel = currentLevel.goBack();
      if (dashboardId){
        nextDashboard = this.currentLevel.dashboards.find(
          (dashboard) => dashboard.id == dashboardId
        );
      }
      this.currentDashboard = nextDashboard
        ? nextDashboard
        : this.currentLevel.dashboards[0];
      
      this.logger.handleEvent(LoggerService.events.NAVIGATION_PATH_CHANGED, this.currentLevel.path.map(node => node.id));
      this.logger.handleEvent(LoggerService.events.NAVIGATION_DASHBOARD_CHANGED, this.currentDashboard.id);
    } else if (levelId){
      this.currentLevel = currentLevel.goChild(levelId);
      dashboardId = currentDashboard.id;

      let nextDashboard = this.currentLevel.dashboards.find(
        (dashboard) => dashboard.id == dashboardId
      );
      this.currentDashboard = nextDashboard
        ? nextDashboard
        : this.currentLevel.dashboards[0];
      
      this.logger.handleEvent(LoggerService.events.NAVIGATION_PATH_CHANGED, this.currentLevel.path.map(node => node.id));
      this.logger.handleEvent(LoggerService.events.NAVIGATION_DASHBOARD_CHANGED, this.currentDashboard.id);
    } else if (dashboardId){
      let nextDashboard = currentLevel.dashboards.find(
        (dashboard) => dashboard.id == dashboardId
      );
      this.currentDashboard = nextDashboard
        ? nextDashboard
        : this.currentDashboard;

      this.logger.handleEvent(LoggerService.events.NAVIGATION_DASHBOARD_CHANGED, this.currentDashboard!.id);
    } else{
      console.warn('[Navigation.ts -- setCurrent]: nothing to do.');
    }
  }

  getCurrentYear(){
    return DataExtractionHelper.get('params')["currentYear"];
  }
}
