import { Component, OnInit } from '@angular/core';
import { Dashboard } from './Dashboard';
import { Level } from './Level';
import { data } from './data';
import { Pipes } from './pipes';
import { throwError } from 'rxjs';

export class Navigation {
  static currenLevel: Level = new Level(data['tree']);
  static currentDashboard: Dashboard =
    Navigation.currenLevel.getDashboardList()[0];

  static getArray(dataType: string) {
    if (dataType == 'level')
      return {
        name: this.currenLevel
          .getSublevels()
          .map((sublevel) => sublevel.getLevelName()),
        id: this.currenLevel
          .getSublevels()
          .map((sublevel) => sublevel.getLevelId()),
        superLevel: {
          name: this.currenLevel.getSuperLevel()?.getLevelName(),
          id: this.currenLevel.getSuperLevel()?.getLevelId(),
        },
      };
    else if (dataType == 'dashboard')
      return {
        id: this.currenLevel
          .getDashboardList()
          .map((dashboard) => dashboard.getDashboardId()),
        name: this.currenLevel
          .getDashboardList()
          .map((dashboard) => dashboard.getDashboardName()),
      };
    else {
      throwError('unknown datatype');
      return;
    }
  }

  static getCurrent() {
    return {
      level: {
        id: this.currenLevel.getLevelId(),
        label: this.currenLevel.getLevelLabel(),
        name: this.currenLevel.getLevelName(),
      },
      dashboard: {
        id: this.currentDashboard.getDashboardId(),
        name: this.currentDashboard.getDashboardName(),
      },
    };
  }

  static setCurrent(
    levelId?: number,
    dashboardId?: number,
    superlevel?: boolean
  ) {
    if (superlevel) {
      this.currenLevel = this.currenLevel.setToParent();
      this.currentDashboard = this.currenLevel.getDashboardList()[0];
    } else if (levelId) {
      this.currenLevel = this.currenLevel.setToChildren(levelId);
      this.currentDashboard = this.currenLevel.getDashboardList()[0];
    } else if (dashboardId) {
      let nextDashboard = this.currenLevel
        .getDashboardList()
        .find((dashboard) => {
          return dashboard.getDashboardId() == dashboardId;
        });
      if (nextDashboard) this.currentDashboard = nextDashboard;
    } else return;
  }
}
