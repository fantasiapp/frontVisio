import Tree, {DataTree} from './Tree';
import DataExtractionHelper from './DataExtractionHelper';

export interface TradeNode{
  readonly id: number;
  readonly name: string;
  readonly children: TradeNode[];
  readonly parent: TradeNode | null;
  readonly height: number;
  readonly siblings: TradeNode[];
  readonly path: TradeNode[];
}

export default function tradeNodeConstructor(tree: Tree){
  return class HiddenNode implements TradeNode {
    id: number;
    name: string;
    children: HiddenNode[];
    parent: HiddenNode | null;
  
    constructor(tree: DataTree, parent: HiddenNode | null = null, height: number = 0){
      if (typeof tree == "number"){
        this.id = tree;
        this.children = [];
      } else{
        this.id = tree[0];
        //don't include last level, which is sale points
        this.children = tree[1].map((subtree: DataTree) => new HiddenNode(subtree, this, height+1));
      }
      
      this.name = (height >= DataExtractionHelper.tradeHeight) ? "" : DataExtractionHelper.getTradeLevelName(height, this.id);
      this.parent = parent;
    }
    
    get height(): number {return this.parent ? this.parent.height + 1 : 0;}
    get path(): HiddenNode[] {return this.parent ? this.parent.path.concat([this]) : [this];}
    get siblings(): HiddenNode[] {return this.parent ? this.parent.children : [this];}
  
    isLeaf(): boolean {return this.children.length == 0;}

    static computeAttributes(){
      this.loadLabels();
    }

    private static loadLabels(){
      tree.attributes['labels'] = [];
      for (let height = 0; height < DataExtractionHelper.tradeHeight; height++)
        tree.attributes['labels'].push(DataExtractionHelper.getTradeLevelLabel(height));      
      tree.attributes['labels'].push('pdv');
    }
  };
}