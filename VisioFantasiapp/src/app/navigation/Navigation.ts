import { Component, OnInit } from '@angular/core';
import { Dashboard } from './Dashboard';
import { Level } from './Level';
import { data } from './data';
import { Pipes } from './pipes';
import { throwError } from 'rxjs';

export class Navigation {
  static currentLevel: Level = new Level(data['tree']);
  static currentDashboard: Dashboard =
    Navigation.currentLevel.getDashboardList()[0];

  static getArray(dataType: string) {
    if (dataType == 'level')
      return {
        currentLevel: {
          name: this.currentLevel
            .getSuperLevel()
            ?.getSublevels()
            .map((sublevel) => sublevel.getLevelName()),
          id: this.currentLevel
            .getSuperLevel()
            ?.getSublevels()
            .map((sublevel) => sublevel.getLevelId()),
        },
        subLevel: {
          name: this.currentLevel
            .getSublevels()
            .map((sublevel) => sublevel.getLevelName()),
          id: this.currentLevel
            .getSublevels()
            .map((sublevel) => sublevel.getLevelId()),
        },
        superLevel: {
          name: this.currentLevel.getSuperLevel()?.getLevelName(),
          id: this.currentLevel.getSuperLevel()?.getLevelId(),
        },
      };
    else if (dataType == 'dashboard')
      return {
        id: this.currentLevel
          .getDashboardList()
          .map((dashboard) => dashboard.getDashboardId()),
        name: this.currentLevel
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
        id: this.currentLevel.getLevelId(),
        label: this.currentLevel.getLevelLabel(),
        name: this.currentLevel.getLevelName(),
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
      let dashboardId = this.currentDashboard.getDashboardId();
      this.currentLevel = this.currentLevel.setToParent();
      let nextDashboard = this.currentLevel
        .getDashboardList()
        .find((dashboard) => dashboard.getDashboardId() == dashboardId);
      this.currentDashboard = nextDashboard
        ? nextDashboard
        : (this.currentDashboard = this.currentLevel.getDashboardList()[0]);
    } else if (levelId) {
      this.currentLevel = this.currentLevel.setToChildren(levelId);
      let dashboardId = this.currentDashboard.getDashboardId();

      let nextDashboard = this.currentLevel
        .getDashboardList()
        .find((dashboard) => dashboard.getDashboardId() == dashboardId);

      console.debug('haha', nextDashboard);
      this.currentDashboard = nextDashboard
        ? nextDashboard
        : (this.currentDashboard = this.currentLevel.getDashboardList()[0]);
    } else if (dashboardId) {
      let nextDashboard = this.currentLevel
        .getDashboardList()
        .find((dashboard) => dashboard.getDashboardId() == dashboardId);
      if (nextDashboard) this.currentDashboard = nextDashboard;
    } else return;
  }
}
