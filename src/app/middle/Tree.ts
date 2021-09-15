export type DataTree = [number, [DataTree]] | number;

export default class Tree{
  attributes: {[key:string]: any[]}     //height -> attribute dictionnary
  root: any;

  constructor(data: any, nodeClassConstructor: (t: Tree) => any){
    this.attributes = {}
    let constructor = nodeClassConstructor(this);
    this.root = new constructor(<DataTree>data);
    constructor.computeAttributes(this);
  }
  
  getNodesAtHeight(height: number): any[]{
    let depthCallback = (currentHeight: number, height: number, result: any): any[] => {
      if (currentHeight == height) return [result];
      return result.children.map((node: any) => depthCallback(currentHeight+1, height, node)).flat();
    };
    return depthCallback(0, height, this.root);
  }
};