import DEH from './DataExtractionHelper';

export class Sale{  
    constructor(private data: number[]){
      this.date = this.data[DEH.SALES_DATE_ID]
    };
  
    get date() {return this.data[DEH.SALES_DATE_ID]}
    get industryId(): number {return this.data[DEH.SALES_INDUSTRY_ID];}
    get industry(): string {return DEH.get('industry')[this.industryId]}
    get productId(): number {return this.data[DEH.SALES_PRODUCT_ID];}
    get volume(): number {return this.data[DEH.SALES_VOLUME_ID];}
    get type(): string{return (this.productId < 4) ? 'p2cd' : ((this.productId == 4) ? 'enduit' : 'other');}
    
    getData(): number[] {return this.data}
  
  
    set date(val: number) {this.data[DEH.SALES_DATE_ID] = val}
    set industryId(val: number) {this.data[DEH.SALES_INDUSTRY_ID] = val;}
    set productId(val: number) {this.data[DEH.SALES_PRODUCT_ID] = val}
    set volume(val: number) {this.data[DEH.SALES_VOLUME_ID] = val;}  
  };