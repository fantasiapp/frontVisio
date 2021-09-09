import Dashboard from './Dashboard';
import DataExtractionHelper from './DataExtractionHelper';
import Tree, { DataTree } from './Tree';
import {PDV} from './Slice&Dice';

export interface NavigationNode {
  readonly id: number;
  readonly children: NavigationNode[];
  readonly parent: NavigationNode | null;
  readonly height: number;
  readonly name: string;
  readonly dashboards: Dashboard[];
  readonly siblings: NavigationNode[];
  readonly label: string;
  readonly path: NavigationNode[];

  goBack(): NavigationNode;
  goChild(id:number): NavigationNode;
};

//dirty code, must find a day for two-way parent-child communication
function navigationNodeConstructor(tree: Tree) {
  return class HiddenNode implements NavigationNode {
    id: number;
    name: string;
    children: HiddenNode[];
    parent: HiddenNode | null;
  
    constructor(tree: DataTree, parent: HiddenNode | null = null, height: number = 0) {
      if ( typeof tree == "number" ) {
        this.id = tree;
        this.children = [];
      } else {
        this.id = tree[0];
        //don't include last level, which is sale points
        this.children = tree[1].map((subtree: DataTree) => new HiddenNode(subtree, this, height+1));
      }
  
      this.name = (height >=  DataExtractionHelper.geoHeight) ? "" : DataExtractionHelper.getGeoLevelName(height, this.id);
      this.parent = parent;
    }
    
    get height(): number { return this.parent ? this.parent.height + 1 : 0; }
    get path(): HiddenNode[] { return this.parent ? this.parent.path.concat([this]) : [this]; }
    get siblings(): HiddenNode[] { return this.parent ? this.parent.children : [this]; }

    get dashboards(): Dashboard[] { return tree.attributes['dashboards'][this.height]; }
    get label(): string { return tree.attributes['labels'][this.height]; }
  
    isLeaf(): boolean { return this.children.length == 0; }
  
    goChild(id: number): HiddenNode {
      return this.children.find(child => child.id == id) || this;
    }
  
    goBack(): HiddenNode {
      return this.parent || this;
    }

    static computeAttributes() {
      this.loadDashboards();
      this.loadLabels();
    }

    private static loadDashboards() {
      tree.attributes['dashboards'] = [];

      let dashboards = DataExtractionHelper.getDashboards();
      for ( let height = 0; height < DataExtractionHelper.geoHeight; height++ )
        tree.attributes['dashboards'].push(DataExtractionHelper.getDashboardsAt(height).map((id: number) => new Dashboard(id, dashboards[id].name)));
      
      //for PDV
      tree.attributes['dashboards'].push([]);
    }

    private static loadLabels() {
      tree.attributes['labels'] = [];
      for ( let height = 0; height < DataExtractionHelper.geoHeight; height++ )
        tree.attributes['labels'].push(DataExtractionHelper.getGeoLevelLabel(height));
      
      tree.attributes['labels'].push('pdv');
    }
  };
}

// Nodes in the level tree
export default navigationNodeConstructor;