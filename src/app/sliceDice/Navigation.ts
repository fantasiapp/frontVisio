import { data as MOCK_DATA } from './test'
import DataExtractionHelper from './DataExtractionHelper';
import Dashboard from './Dashboard';
import Tree, { DataTree } from './Tree';
import navigationNodeConstructor, { NavigationNode } from './NavigationNode';


class Navigation {
  static root: NavigationNode;
  static currentLevel: NavigationNode;
  static currentDashboard: Dashboard;

  static setData(data: any) {
    DataExtractionHelper.setData(data);
    this.root = <NavigationNode>(new Tree(DataExtractionHelper.getGeoTree(), navigationNodeConstructor)).root;
    this.currentLevel = this.root;
    this.currentDashboard = this.currentLevel.dashboards[0];
  }

  static getArray(dataType: 'level' | 'dashboard'): any {

    if ( dataType == 'level' ) {
      return {
        currentLevel: {
          name: this.currentLevel.siblings.map((sibling: NavigationNode) => sibling.name),
          id: this.currentLevel.siblings.map((sibling: NavigationNode) => sibling.id)
        },
        subLevel: {
          name: this.currentLevel.children.map((child: NavigationNode) => child.name),
          id: this.currentLevel.children.map((child: NavigationNode) => child.id)
        },
        superLevel: {
          name: this.currentLevel.parent?.name,
          id: this.currentLevel.parent?.id
        },

        currentLevelLabel: this.currentLevel.label,
        subLevelLabel: (this.currentLevel.children[0] as NavigationNode)?.label,
        superLevelLabel: (this.currentLevel.parent as NavigationNode)?.label
      }
    } else {
      return {
        id: this.currentLevel.dashboards.map(dashboard => dashboard.id),
        name: this.currentLevel.dashboards.map(dashboard => dashboard.name)
      }
    }
  };

  static getCurrent(): any {
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

Navigation.setData(MOCK_DATA);
export default Navigation;