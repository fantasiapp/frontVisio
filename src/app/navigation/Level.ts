import Dashboard from './Dashboard';
import DataExtractionHelper from './DataExtractionHelper';

//only ever used in generating the tree
type LevelTree = [number, [LevelTree]] | number;

export default class Level {
  static dashboards: Dashboard[][]; //height -> dashboard
  static labels: string[];          //height -> label

  static loadDashboards() {
    let dashboards = DataExtractionHelper.getDashboards();
    this.dashboards = [];
    for ( let height = 0; height < DataExtractionHelper.height(); height++ )
      this.dashboards.push(DataExtractionHelper.getDashboardsAt(height).map((id: number) => new Dashboard(id, dashboards[id].name)));
}

  static loadLabels() {
    this.labels = [];
    for ( let height = 0; height < DataExtractionHelper.height(); height++ )
      this.labels.push(DataExtractionHelper.getLevelLabel(height));
  }

  static loadLevelTree(): Level {
    let root = new Level(<LevelTree>DataExtractionHelper.getLevelTree(), null);
    this.loadDashboards();
    this.loadLabels();
    return root;
  }

  readonly id: number;
  readonly name: string;
  readonly children: Level[];
  readonly parent: Level | null;

  private constructor(tree: LevelTree, parent:Level|null, height:number = 0) {
    if ( typeof tree == "number" ) {
      this.id = tree;
      this.children = [];
    } else {
      this.id = tree[0];
      //don't include last level, which is sale points
      this.children = (height < DataExtractionHelper.height()-1) ? tree[1].map((subtree: LevelTree) => new Level(subtree, this, height+1)) : [];
    }

    this.name = DataExtractionHelper.getLevelName(height, this.id);
    this.parent = parent;
  }
  
  get dashboards(): Dashboard[] { return Level.dashboards[this.height]; }
  get label(): string { return Level.labels[this.height]; }
  get height(): number { return this.parent ? this.parent.height + 1 : 0; }
  get siblings(): Level[] { return this.parent ? this.parent.children : [this]; }
  get path(): Level[] {
    return this.parent ? this.parent.path.concat([this]) : [this];
  }

  isLeaf() { return this.children.length == 0; }

  //if child with `id` is found return it, otherwise return self
  navigateChild(id: number) {
    return this.children.find(child => child.id == id) || this;
  }

  //if parent exists return it, otherwise return self
  navigateBack() {
    return this.parent || this;
  }
};