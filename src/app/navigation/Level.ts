import { throwError } from 'rxjs';
import { Dashboard } from './Dashboard';
import { Pipes } from './pipes';

export class Level {
  private sublevels: Level[] = [];
  private superlevel?: Level;
  private levelId: number = 0;
  private dashboardList: Dashboard[] = [];

  constructor(tree: any) {
    // cas d'arrêt
    if (typeof tree === 'number') {
      this.levelId = tree;
    }
    // construction récursive
    else {
      this.levelId = tree[0];
      tree[1].map((subtree: any) => {
        let sublevel = new Level(subtree);
        this.sublevels.push(sublevel);
      });
    }
    this.sublevels.map((sublevel) => {
      sublevel.setSuperlevel(this);
    });
  }
  private setSuperlevel(superlevel: Level) {
    this.superlevel = superlevel;
  }

  public getLevelId(): number {
    return this.levelId;
  }

  // private findUpLevel(dashboardId:number):(number|undefined){

  //   if(this.sublevels.length() == 0){
  //     return undefined
  //   }
  //   else if(this.sublevels[0].isDashboardExist(dashboardId)){
  //     return  this.getHeight()
  //   }

  // }

  // private findDownLevel(DashboardId:number):(number|undefined){
  //   return 0

  // }

  // public findLevelLabel(DashboardId: number):(number|undefined)[]{
  //   let upIndex:number|undefined, downIndex:number|undefined

  //   if(this.sublevels.length == 0){
  //     downIndex = undefined
  //   }

  //   if(!this.superlevel){
  //     upIndex = undefined
  //   }

  //   else{

  //   }

  // }

  public getLabelPath(): any[] {
    if (!this.superlevel) {
      return [[0, 0]];
    } else {
      let newLabelPath = this.superlevel.getLabelPath();
      newLabelPath.push([this.getHeight(), this.getLevelId()]);
      return newLabelPath;
    }
  }

  public isDashboardExist(dashboardId: number): boolean {
    return this.dashboardList
      .map((dashboard) => dashboard.getDashboardId())
      .includes(dashboardId);
  }

  public getDashboardList(): Dashboard[] {
    if (this.dashboardList.length == 0) {
      Pipes.getDashboardIdList(this.getHeight()).map((id) => {
        this.dashboardList.push(Pipes.getDashboard(id));
        return;
      });
      return this.dashboardList;
    } else return this.dashboardList;
  }
  public getSublevels(): Level[] {
    return this.sublevels;
  }

  public getLevelLabel(): string {
    return Pipes.getLevelLabel(this.getHeight());
  }

  public getLevelName(): string {
    if (!this.superlevel) return '';
    return Pipes.getLevelName(this.getHeight(), this.levelId);
  }

  public getHeight(): number {
    if (!this.superlevel) return 0;
    else return this.superlevel.getHeight() + 1;
  }

  public getSuperLevel(): Level | undefined {
    return this.superlevel;
  }

  public setToHeight(height: number): Level {
    let currentHeight = this.getHeight();

    if (height > currentHeight) {
      let level = this.sublevels[0];
      for (let i = 0; i < height - currentHeight - 1; i++) {
        level = level.setToChildren();
      }
      return level;
    } else if (height < currentHeight) {
      let level = this.setToParent();
      for (let i = 0; i < currentHeight - height - 1; i++) {
        level = level.setToParent();
      }
      return level;
    } else return this;
  }

  public setToParent(): Level {
    //if parent exist, return parent, else return itself
    if (this.superlevel) return this.superlevel;
    else return this;
  }

  public setToChildren(id?: number): Level {
    //if children exist, return parent, else return itself
    if (!id) {
      return this.sublevels[0];
    }
    let children = this.sublevels.find((sublevel) => {
      return sublevel.getLevelId() == id;
    });
    if (children) return children;
    // else return this;
    else {
      throwError('unknown level');
      return this;
    }
  }
}
