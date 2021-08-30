import { Dashboard } from './Dashboard';
import { data } from './data';

export class Pipes {
  // height to name
  static getLevelLabel(height: number): string {
    return data['levels'][height]['label'];
  }
  // height + id to name
  static getLevelName(height: number, levelId: number): string {
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
  //
}
