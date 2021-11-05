import Dashboard from "./Dashboard";
import DEH, { DataTree, TreeExtractionHelper } from "./DataExtractionHelper";
import { PDV } from "./Pdv";

export interface Node {
  id: number;
  name: string;
  children: Node[] | PDV[];
  parent: Node | null;
  height: number;
  path: Node[];
  siblings: Node[];
  dashboards: Dashboard[];
  label: string;
  nature: string;

  isLeaf: () => boolean;
  goChild: (id: number) => Node;
  goBack: () => Node;
}

function createNode(tree: Tree, extractor: TreeExtractionHelper) {
  return class TreeNode implements Node {
    id: number;
    name: string;
    children: TreeNode[] | PDV[];
    parent: TreeNode | null;

    constructor(tree: DataTree, parent: TreeNode | null = null, height: number = 0) {
      if (typeof tree == "number") {
        this.id = tree;
        this.children = [];
      } else {
        this.id = tree[0];
        //last level is made of PDV
        if ( height == extractor.height-1 )
          this.children = tree[1].map((subtree: DataTree) => PDV.findById(subtree as number)!);
        else
          this.children = tree[1].map((subtree: DataTree) => new TreeNode(subtree, this, height+1));
      }
      
      this.name = extractor.getName(height, this.id);
      this.parent = parent;
    }

    get height(): number{ return this.parent ? this.parent.height + 1 : 0; }
    get path(): TreeNode[] { return this.parent ? this.parent.path.concat([this]) : [this]; }
    get siblings(): TreeNode[] { return this.parent ? (this.parent.children as TreeNode[]) : [this]; }
    get dashboards(): Dashboard[]{ return tree.attributes['dashboards'][this.height];}
    get label(): string { return tree.attributes['labels'][this.height]; }
    get nature(): string { return tree.attributes['natures'][this.height]; }
    
    isLeaf(): boolean { return this.children.length == 0;}
  
    goChild(id: number): TreeNode {
      //dont navigation to PDV
      if ( this.height == extractor.height )
        return this;
      
      return (this.children as Node[]).find((child: Node) => child.id == id) || this;
    }
  
    goBack(): TreeNode  {
      return this.parent || this;
    }

    static computeAttributes() {
      this.computeDashboards();
      this.computeLabels();
      this.computeNatures()
    }

    private static computeLabels(){
      tree.attributes['labels'] = [];
      for ( let height = 0; height < extractor.height; height++ )
        tree.attributes['labels'].push(extractor.getLevelLabel(height));
      tree.attributes['labels'].push('PDV');      
    }

    private static computeNatures() {
      tree.attributes['natures'] = [];
      for ( let height = 0; height < extractor.height; height++ )
        tree.attributes['natures'].push(extractor.getLevelNature(height));
      tree.attributes['natures'].push('pdv');
    }

    private static computeDashboards(){
      tree.attributes['dashboards'] = [];

      let dashboards = DEH.get('dashboards');
      let layouts = DEH.get('layout');
      for (let height = 0; height < extractor.height; height++)
        tree.attributes['dashboards'].push(
          extractor.getDashboardsAtHeight(height).map(
            (id: number) => new Dashboard(
              id, 
              dashboards[id], 
              layouts[dashboards[id][DEH.DASHBOARD_LAYOUT_INDEX]][DEH.LAYOUT_TEMPLATE_INDEX]
            )
          )
        );
      
      //for PDV
      tree.attributes['dashboards'].push([]);
    }
  };
};

export class Tree {
  readonly attributes: {[key:string]: any[]}     //height -> attribute dictionnary
  root: Node;
  private type: TreeExtractionHelper;

  constructor(extractor: TreeExtractionHelper){
    this.type = extractor;
    this.attributes = {}
    //compute the data field
    let data = extractor.loadData();
    let constructor = createNode(this, extractor);
    this.root = new constructor(data as any);
    constructor.computeAttributes();
  }

  //including pdvs
  get height() {
    return this.attributes['labels'].length;
  }

  hasTypeOf(t: Tree | TreeExtractionHelper) {
    if ( t instanceof Tree )
      return this.type == t.type;
    else
      return this.type == t;
  }

  getAllDashboards() {
    let dict: any = {};
    this.attributes['dashboards'].flat().forEach(dashboard =>
      dict[dashboard.id] = dashboard
    );
    return Object.values<Dashboard>(dict);
  }
  
  getNodesAtHeight(height: number): any[] {
    if ( height < 0 ) { throw 'No height < 0.'; };
    let depthCallback = (currentHeight: number, height: number, result: any): any[] => {
      if (currentHeight == height) return [result];
      return result.children.map((node: any) => depthCallback(currentHeight+1, height, node)).flat();
    };
    return depthCallback(0, height, this.root);
  }

  get natures() { return this.attributes['natures']; }
  get labels() { return this.attributes['labels']; }
  get dashboards() { return this.attributes['dashboards']; }
};