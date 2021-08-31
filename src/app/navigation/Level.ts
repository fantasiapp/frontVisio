import Dashboard from './Dashboard';
import Pipes from './pipes';

//only ever used in generating the tree
type LevelTree = [number, [LevelTree]] | number;

//class that reflects the data in Pipes.data
export default class Level {
  static dashboards: Dashboard[][] = []; //height -> dashboard
  static labels: string[] = [];          //height -> label

  //load level tree from Pipes.data
  static loadLevelTree(tree?: LevelTree, parent?: Level, recursive=0): Level {
    if ( !tree ) tree = <LevelTree>Pipes.getLevelTree();

    let level: Level;
    let id: number;

    //create hierarchy
    if ( typeof tree == "number" ) {
      //base case
      id = tree;
      level = new Level(id, Pipes.getLevelName(recursive, id), [], parent);
    } else {
      //recursion
      id = tree[0];
      level = new Level(id, Pipes.getLevelName(recursive, id), [], parent);
      //add children through recursion -- stop before adding les points de vente (should this be added ?)
      if ( recursive+1 < Pipes.height() ) {
        Array.prototype.push.apply(level.children, tree[1].map((subtree: LevelTree): Level => this.loadLevelTree(subtree, level, recursive+1)));
      }
    }

    //Done, tree created
    //Now represent the labels and dashboards for each height
    if ( recursive == 0 ) {
      //load all labels
      this.labels = [];
      for ( let height = 0; height < Pipes.height(); height++ )
        this.labels.push(Pipes.getLevelLabel(height));
      
      //load all dashboards
      Dashboard.fromData();
      this.dashboards = [];
      for ( let height = 0; height < Pipes.height(); height++ )
        this.dashboards.push(Pipes.getDashboardsAt(height).map((key: number) => Dashboard.byId(key)!));
    }

    //no longer depend on data after this call
    return level;
  }

  //No instances can be made from the outside, this is to ensure that this class reflects Pipes.data
  private constructor(readonly id: number, readonly name: string, readonly children: Level[], readonly parent?: Level) { }
  
  get dashboards(): Dashboard[] { return Level.dashboards[this.height]; }
  get label(): string { return Level.labels[this.height]; }
  get height(): number { return this.parent ? this.parent.height + 1 : 0; }
  get siblings(): Level[] { return this.parent ? this.parent.children : [this]; }

  //is this level a leaf ?
  isLeaf() { return this.children.length == 0; }

  //if child with `id` is found return it, otherwise return self.
  navigateChild(id: number) {
    return this.children.find(child => child.id == id) || this;
  }

  //if parent exists return it, otherwise return self
  navigateBack() {
    return this.parent || this;
  }
};