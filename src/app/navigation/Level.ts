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

  public setToParent(): Level {
    //if parent exist, return parent, else return itself
    if (this.superlevel) return this.superlevel;
    else return this;
  }

  public setToChildren(id: number): Level {
    //if children exist, return parent, else return itself
    let children = this.sublevels.find((sublevel) => {
      return sublevel.getLevelId() == id;
    });
    if (children) return children;
    else return this;
  }
}
