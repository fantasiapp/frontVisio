import { Dashboard } from './Dashboard';
import { data } from './data';

export class Pipes {
  // height to name
  static getLevelLabel(height: number): string {

    if(height == 0) return 'National'
    return data['levels'][height]['label'];
  }
  // height + id to name
  static getLevelName(height: number, levelId: number): string {

    if(height == 0 ) return 'France'
    let label = Pipes.getLevelLabel(height)

    return data[label][levelId.toString()];
  }
  // height to size of Dashboard
  static getDashboardIdList(height: number): number[] {
    return data['levels'][height]['dashboards'];
  }
  // id of dashboard + level = name of the dashboard
  static getDashboard(dashboardId: number): Dashboard {
    let id = dashboardId;
    let name = data['dashBoard'][dashboardId.toString()]['name'];
    return new Dashboard(id, name);
  }
  // find the next level with a given dashboard and the current dashboard

  static getNextHeight(dashBoardId: number,currentHeight: number ): (number|undefined){
    return data['levels'].findIndex((level:any, index:number) => (currentHeight<index)&&(level['dashboards']).include(dashBoardId))
  }

  static getPreviousLevel(dashBoardId: number, currentHeight: Number): (number|undefined){
    return data['levels'].findIndex((level:any, index:number) => (currentHeight>index)&&(level['dashboards']).include(dashBoardId))


  }
}
