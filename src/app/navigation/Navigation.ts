//GENERAL NOTES
//I think the interface given by Level & Dashboard are enough to navigate
//Though maybe this file can satisfy the needs of the front, maybe we can come up with a compromise

import { data as MOCK_DATA } from './data';
import Pipes from './pipes';
import Level from './Level';

Pipes.setData(MOCK_DATA); //<-- put data from request here

namespace Navigation {
  export let root: Level = Level.loadLevelTree();
  export let currentLevel: Level = root;
  export let currentDashboard = currentLevel.dashboards[0];

  export function getArray(dataType: string) {
    if ( dataType == 'level' ) {
      return {
        currentLevel: {
          name: currentLevel.siblings.map((sibling: Level) => sibling.name),
          id: currentLevel.siblings.map((sibling: Level) => sibling.id)
        },
        subLevel: {
          name: currentLevel.children.map((child: Level) => child.name),
          id: currentLevel.children.map((child: Level) => child.id)
        },
        superLevel: {
          name: currentLevel.parent?.name,
          id: currentLevel.parent?.id
        }
      }
    } else if ( dataType == 'dashboard' ) {
      return {
        id: currentLevel.dashboards.map(dashboard => dashboard.id),
        name: currentLevel.dashboards.map(dashboard => dashboard.name)
      }
    }  else {
      throw 'unknown datatype';
    }
  };

  export function getCurrent() {
    return {
      level: {
        id: currentLevel.id,
        name: currentLevel.name,
        label: currentLevel.label
      },
      dashboard: {
        id: currentDashboard.id,
        name: currentDashboard.name
      }
    }
  };

  export function setCurrent(levelId?: number, dashboardId?: number, superLevel?: boolean) {
    if ( superLevel ) {
      let dashboardId = currentDashboard.id, nextDashboard;
      currentLevel = currentLevel.navigateBack();
      if ( dashboardId ) {
        currentLevel.dashboards.find(dashboard => dashboard.id == dashboardId)
      }
      
      currentDashboard = nextDashboard ? nextDashboard : (currentLevel.dashboards[0]);
    }

    else if ( levelId ) {
      currentLevel = currentLevel.navigateChild(levelId);
      dashboardId = currentDashboard.id;

      let nextDashboard = currentLevel.dashboards.find(dashboard => dashboard.id == dashboardId);
      currentDashboard = nextDashboard ? nextDashboard : currentLevel.dashboards[0];
    }

    else if ( dashboardId ) {
      let nextDashboard = currentLevel.dashboards.find((dashboard) => dashboard.id == dashboardId);
      currentDashboard = nextDashboard ? nextDashboard : currentDashboard; 
    }

    else {
      console.warn("[Navigation.ts -- setCurrent]: nothing to do.");
    }
  }
};

export default Navigation;