import { data as MOCK_DATA } from './data';
import DataExtractionHelper from './DataExtractionHelper';
import Level from './Level';
import Dashboard from './Dashboard';

DataExtractionHelper.setData(MOCK_DATA); //<-- put data from request here

class Navigation {
  static root: Level = Level.loadLevelTree();
  static currentLevel: Level = Navigation.root;
  static currentDashboard: Dashboard = Navigation.currentLevel.dashboards[0];

  static getArray(dataType: 'level' | 'dashboard') : any{

    if ( dataType == 'level' ) {
      return {
        currentLevel: {
          name: this.currentLevel.siblings.map((sibling: Level) => sibling.name),
          id: this.currentLevel.siblings.map((sibling: Level) => sibling.id)
        },
        subLevel: {
          name: this.currentLevel.children.map((child: Level) => child.name),
          id: this.currentLevel.children.map((child: Level) => child.id)
        },
        superLevel: {
          name: this.currentLevel.parent?.name,
          id: this.currentLevel.parent?.id
        }
      }
    } else {
      return {
        id: this.currentLevel.dashboards.map(dashboard => dashboard.id),
        name: this.currentLevel.dashboards.map(dashboard => dashboard.name)
      }
    }
  };

  static getCurrent() :any {
    return {
      level: {
        id: this.currentLevel.id,
        name: this.currentLevel.name,
        label: this.currentLevel.label
      },
      dashboard: {
        id: this.currentDashboard.id,
        name: this.currentDashboard.name
      },
      path: this.currentLevel.path.map((level) => level.label + ' ' + level.name)
    }
  };

  static setCurrent(levelId?: number, dashboardId?: number, superLevel?: boolean) {
    if ( superLevel ) {
      let dashboardId = this.currentDashboard.id, nextDashboard;
      this.currentLevel = this.currentLevel.navigateBack();
      if ( dashboardId ) {
        this.currentLevel.dashboards.find(dashboard => dashboard.id == dashboardId)
      }
      
      this.currentDashboard = nextDashboard ? nextDashboard : (this.currentLevel.dashboards[0]);
    }

    else if ( levelId ) {
      this.currentLevel = this.currentLevel.navigateChild(levelId);
      dashboardId = this.currentDashboard.id;

      let nextDashboard = this.currentLevel.dashboards.find(dashboard => dashboard.id == dashboardId);
      this.currentDashboard = nextDashboard ? nextDashboard : this.currentLevel.dashboards[0];
    }

    else if ( dashboardId ) {
      let nextDashboard = this.currentLevel.dashboards.find((dashboard) => dashboard.id == dashboardId);
      this.currentDashboard = nextDashboard ? nextDashboard : this.currentDashboard; 
    }

    else {
      console.warn("[Navigation.ts -- setCurrent]: nothing to do.");
    }
  }
};

export default Navigation;