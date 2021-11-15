import DEH from './DataExtractionHelper';

export class Sale{  
    constructor(private data: number[]){
      this.date = this.data[DEH.getPositionOfAttr('structureSales', 'date')]
    };
  
    get date() {return this.data[DEH.getPositionOfAttr('structureSales', 'date')]}
    get industryId(): number {return this.data[DEH.getPositionOfAttr('structureSales', 'industry')];}
    get industry(): string {return DEH.get('industry')[this.industryId]}
    get productId(): number {return this.data[DEH.getPositionOfAttr('structureSales', 'product')];}
    get volume(): number {return this.data[DEH.getPositionOfAttr('structureSales', 'volume')];}
    get type(): string{return (this.productId < 4) ? 'p2cd' : ((this.productId == 4) ? 'enduit' : 'other');}
    
    getData(): number[] {return this.data}  
  
    set date(val: number) {this.data[DEH.getPositionOfAttr('structureSales', 'date')] = val}
    set industryId(val: number) {this.data[DEH.getPositionOfAttr('structureSales', 'industry')] = val;}
    set productId(val: number) {this.data[DEH.getPositionOfAttr('structureSales', 'product')] = val}
    set volume(val: number) {this.data[DEH.getPositionOfAttr('structureSales', 'volume')] = val;}  
  };