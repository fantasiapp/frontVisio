import { DataService } from './../services/data.service';
import { data as MOCK_DATA } from './data';
import DataExtractionHelper from './DataExtractionHelper';
import Node from './Node';
import Dashboard from './Dashboard';
import { Injectable } from '@angular/core';

@Injectable()
export class Navigation {
  root?: Node;
  currentLevel?: Node;
  currentDashboard?: Dashboard;

  setData(data: any) {
    DataExtractionHelper.setData(data);
    this.root = Node.loadLevelTree();
    this.currentLevel = this.root;
    this.currentDashboard = this.currentLevel.dashboards[0];
  }

  constructor(private dataservice : DataService){
  }

  getArray(dataType: 'level' | 'dashboard'): any {
    let currentLevel = this.currentLevel!
    if (dataType == 'level') {
      return {
        currentLevel: {
          name: currentLevel.siblings.map((sibling: Node) => sibling.name),
          id: currentLevel.siblings.map((sibling: Node) => sibling.id),
          label: currentLevel.children.map((child: Node) => child.label),
        },
        subLevel: {
          name: currentLevel.children.map((child: Node) => child.name),
          id: currentLevel.children.map((child: Node) => child.id),
          label: currentLevel.children.map((child: Node) => child.label),
        },
        superLevel: {
          name: currentLevel.parent?.name,
          id: currentLevel.parent?.id,
          label: currentLevel.parent?.label,
        },
      };
    } else {
      return {
        id: currentLevel.dashboards.map((dashboard) => dashboard.id),
        name: currentLevel.dashboards.map((dashboard) => dashboard.name),
      };
    }
  }

  getCurrent(): any {
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
      },
      path: currentLevel.path.map(
        (level) => level.label +': '+ level.name 
      ),
    };
  }

  setCurrent(
    levelId?: number,
    dashboardId?: number,
    superLevel?: boolean
  ) {
    let currentLevel = this.currentLevel!
    let currentDashboard = this.currentDashboard!
    if (superLevel) {
      let dashboardId = currentDashboard.id,
        nextDashboard;
      this.currentLevel = currentLevel.goBack();
      if (dashboardId) {
        nextDashboard = this.currentLevel.dashboards.find(
          (dashboard) => dashboard.id == dashboardId
        );
      }
      this.currentDashboard = nextDashboard
        ? nextDashboard
        : this.currentLevel.dashboards[0];
    } else if (levelId) {
      this.currentLevel = currentLevel.goChild(levelId);
      dashboardId = currentDashboard.id;

      let nextDashboard = this.currentLevel.dashboards.find(
        (dashboard) => dashboard.id == dashboardId
      );
      this.currentDashboard = nextDashboard
        ? nextDashboard
        : this.currentLevel.dashboards[0];
    } else if (dashboardId) {
      let nextDashboard = currentLevel.dashboards.find(
        (dashboard) => dashboard.id == dashboardId
      );
      this.currentDashboard = nextDashboard
        ? nextDashboard
        : this.currentDashboard;
    } else {
      console.warn('[Navigation.ts -- setCurrent]: nothing to do.');
    }
  }
}
