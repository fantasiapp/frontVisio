import Dashboard from './Dashboard';
import DataExtractionHelper from './DataExtractionHelper';

type NodeTree = [number, [NodeTree]] | number;

// Nodes in the level tree
export default class Node {
  static dashboards: Dashboard[][]; //height -> dashboard
  static labels: string[];          //height -> label

  static loadLevelTree(): Node {
    let root = new Node(<NodeTree>DataExtractionHelper.getLevelTree(), null);
    this.loadDashboards();
    this.loadLabels();
    return root;
  }
  
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

  readonly id: number;
  readonly name: string;
  readonly children: Node[];
  readonly parent: Node | null;

  private constructor(tree: NodeTree, parent: Node | null, height: number = 0) {
    if ( typeof tree == "number" ) {
      this.id = tree;
      this.children = [];
    } else {
      this.id = tree[0];
      //don't include last level, which is sale points
      this.children = (height < DataExtractionHelper.height()-1) ? tree[1].map((subtree: NodeTree) => new Node(subtree, this, height+1)) : [];
    }

    this.name = DataExtractionHelper.getLevelName(height, this.id);
    this.parent = parent;
  }
  
  get dashboards(): Dashboard[] { return Node.dashboards[this.height]; }
  get label(): string { return Node.labels[this.height]; }
  get height(): number { return this.parent ? this.parent.height + 1 : 0; }
  get siblings(): Node[] { return this.parent ? this.parent.children : [this]; }
  get path(): Node[] { return this.parent ? this.parent.path.concat([this]) : [this]; }

  isLeaf() { return this.children.length == 0; }

  goChild(id: number) {
    return this.children.find(child => child.id == id) || this;
  }

  goBack() {
    return this.parent || this;
  }
};