import Dashboard from "./Dashboard";
import DataExtractionHelper, { DataTree, TreeExtractionHelper, NavigationExtractionHelper, TradeExtrationHelper } from "./DataExtractionHelper";
import { PDV } from "./Slice&Dice";

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
      if (typeof tree == "number"){
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

    static computeAttributes(){
      this.computeDashboards();
      this.computeLabels();
    }

    private static computeLabels(){
      tree.attributes['labels'] = [];
      for ( let height = 0; height < extractor.height; height++ )
        tree.attributes['labels'].push(extractor.getLevelLabel(height));      
      tree.attributes['labels'].push('PDV');
    }

    private static computeDashboards(){
      tree.attributes['dashboards'] = [];

      let dashboards = DataExtractionHelper.get('dashboards');
      let layouts = DataExtractionHelper.get('layout');
      for (let height = 0; height < extractor.height; height++)
        tree.attributes['dashboards'].push(
          DataExtractionHelper.getDashboardsAt(height).map(
            (id: number) => new Dashboard(
              id, 
              dashboards[id], 
              layouts[dashboards[id][DataExtractionHelper.DASHBOARD_LAYOUT_INDEX]][DataExtractionHelper.LAYOUT_TEMPLATE_INDEX]
            )
          )
        );
      
      //for PDV
      tree.attributes['dashboards'].push([]);
    }
  };
};

export class Tree {
  attributes: {[key:string]: any[]}     //height -> attribute dictionnary
  root: any;

  constructor(extractor: TreeExtractionHelper){
    this.attributes = {}
    //compute the data field
    if ( typeof extractor.data === 'string' )
      extractor.data = DataExtractionHelper.get(extractor.data);
    
    let constructor = createNode(this, extractor);
    this.root = new constructor(extractor.data as DataTree);
    constructor.computeAttributes();
  }

  //including pdvs
  get height() {
    return this.attributes['labels'].length;
  }
  
  getNodesAtHeight(height: number): any[]{
    let depthCallback = (currentHeight: number, height: number, result: any): any[] => {
      if (currentHeight == height) return [result];
      return result.children.map((node: any) => depthCallback(currentHeight+1, height, node)).flat();
    };
    return depthCallback(0, height, this.root);
  }
};