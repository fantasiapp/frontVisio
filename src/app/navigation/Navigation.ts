import { data as MOCK_DATA } from './data';
import { DataService } from '../services/data.service';
import DataExtractionHelper from './DataExtractionHelper';
import Node from './Node';
import Dashboard from './Dashboard';

class Navigation {
  static root: Node;
  static currentLevel: Node;
  static currentDashboard: Dashboard;
  
  static setData(data: any) {
    DataExtractionHelper.setData(data);
    this.root = Node.loadLevelTree();
    this.currentLevel = this.root;
    this.currentDashboard = this.currentLevel.dashboards[0];
  }

  static getArray(dataType: 'level' | 'dashboard') : any{

    if ( dataType == 'level' ) {
      return {
        currentLevel: {
          name: this.currentLevel.siblings.map((sibling: Node) => sibling.name),
          id: this.currentLevel.siblings.map((sibling: Node) => sibling.id),
          label: this.currentLevel.children.map((child: Node) => child.label),
        },
        subLevel: {
          name: this.currentLevel.children.map((child: Node) => child.name),
          id: this.currentLevel.children.map((child: Node) => child.id),
          label: this.currentLevel.children.map((child: Node) => child.label),

        },
        superLevel: {
          name: this.currentLevel.parent?.name,
          id: this.currentLevel.parent?.id,
          label: this.currentLevel.parent?.label
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
      this.currentLevel = this.currentLevel.goBack();
      if ( dashboardId ) {
        this.currentLevel.dashboards.find(dashboard => dashboard.id == dashboardId)
      }
      
      this.currentDashboard = nextDashboard ? nextDashboard : (this.currentLevel.dashboards[0]);
    }

    else if ( levelId ) {
      this.currentLevel = this.currentLevel.goChild(levelId);
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
Navigation.setData(JSON.parse(sessionStorage.getItem('data')!));
export default Navigation;