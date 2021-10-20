import DataExtractionHelper, {NavigationExtractionHelper, TradeExtrationHelper} from './DataExtractionHelper';
import Dashboard from './Dashboard';
import {Injectable} from '@angular/core';
import {Tree, Node} from './Node';
import { PDV } from './Slice&Dice';

@Injectable()
export class Navigation {
  tree?: Tree;
  currentLevel?: Node;
  currentDashboard?: Dashboard;

  constructor() { }

  setTree(t: Tree){    
    this.tree = t ? t : new Tree(NavigationExtractionHelper);
    this.currentLevel = this.tree.root;
    this.currentDashboard = this.currentLevel!.dashboards[0];
  }

  setNode(t: Tree, node: Node) {
    this.tree = t;
    this.currentLevel = node;
    let dashboardId = this.currentDashboard!.id;
    let nextDashboard = node.dashboards.findIndex(
      (dashboard) => dashboard.id == dashboardId
    );

    this.currentDashboard = node.dashboards[nextDashboard] || node.dashboards[0];
  }

  followTree(t: Tree) {
    let path = this.currentLevel ? this.currentLevel.path.slice(1).map(level => level.id) : null,
      dashboardIndex: number,
      sameType = this.tree?.type === t.type;
    
    if ( path )
      dashboardIndex = this.currentLevel!.dashboards.findIndex(dashboard => dashboard.id == this.currentDashboard?.id);
    
    this.setTree(t);
    if ( sameType && path  ) {
      for ( let id of path )
        this.currentLevel = this.currentLevel!.goChild(id);
      
      this.currentDashboard = this.currentLevel!.dashboards[dashboardIndex!] || this.currentLevel?.dashboards[0];
    }
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
        name: this.tree?.root.name, id: 0, label: this.tree?.root.label 
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
    } else if (levelId){
      this.currentLevel = currentLevel.goChild(levelId);
      dashboardId = currentDashboard.id;

      let nextDashboard = this.currentLevel.dashboards.find(
        (dashboard) => dashboard.id == dashboardId
      );
      this.currentDashboard = nextDashboard
        ? nextDashboard
        : this.currentLevel.dashboards[0];
    } else if (dashboardId){
      let nextDashboard = currentLevel.dashboards.find(
        (dashboard) => dashboard.id == dashboardId
      );
      this.currentDashboard = nextDashboard
        ? nextDashboard
        : this.currentDashboard;
    } else{
      console.warn('[Navigation.ts -- setCurrent]: nothing to do.');
    }
  }

  getCurrentYear(){
    return DataExtractionHelper.get('params')["currentYear"];
  }
}
