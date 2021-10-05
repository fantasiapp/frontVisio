import { ChangeDetectionStrategy, Component, ElementRef, EventEmitter, HostBinding, Input, Output, ViewChild } from '@angular/core';
import DataExtractionHelper from 'src/app/middle/DataExtractionHelper';
import { PDV } from 'src/app/middle/Slice&Dice';
import { DataService } from 'src/app/services/data.service';

@Component({
  selector: 'info-bar',
  templateUrl: './info-bar.component.html',
  styleUrls: ['./info-bar.component.css'],
})
export class InfoBarComponent {
  @HostBinding('class.opened')
  opened: boolean = false;
  
  @Input()
  set pdv(value: PDV | undefined) {
    this._pdv = value;
    this.opened = value ? true : false;
    this.currentIndex = 0;
    this.pdvChange.emit(value);
    if ( value ) {
      let target = value!.getLightTarget();
      console.log(target);
      this.targetClass = { 'r': target == 'r', 'g': target == 'g', 'o': target == 'o' };
    } 
  }

  @Output()
  pdvChange = new EventEmitter<PDV | undefined>();

  pages: string[] = ['Référentiel', 'Ciblage', 'Saisie de l\'AD'];
  currentIndex: number = 0;

  industries: string[] = (PDV.getIndustries() as string[]);
  products: string[] = PDV.getProducts() as string[];
  grid: number[][] = [];
  targetClass: any = {
    'r': false,
    'g': false,
    'o': false
  };

  TARGET_SALE_ID = DataExtractionHelper.TARGET_SALE_ID;
  TARGET_REDISTRIBUTED_ID = DataExtractionHelper.TARGET_REDISTRIBUTED_ID;
  TARGET_VOLUME_ID = DataExtractionHelper.TARGET_VOLUME_ID;
  TARGET_COMMENT_ID = DataExtractionHelper.TARGET_COMMENT_ID;
  TARGET_LIGHT_ID = DataExtractionHelper.TARGET_LIGHT_ID;

  get pdv() {
    return this._pdv;
  }

  private _pdv: PDV | undefined;
  redistributed?: boolean;

  getName(name: string) {
    return DataExtractionHelper.getNameOfRegularObject(name, this._pdv!.attribute(name));
  }

  constructor(private ref: ElementRef, private dataService: DataService) {
    console.log('[InfobarComponent]: On');
    this.products.splice(3, this.products.length, 'P2CD')
    this.grid = new Array(this.industries.length + 1);
    for ( let i = 0; i < this.grid.length; i++ )
      this.grid[i] = new Array(this.products.length).fill(0);
  }

  //make variable
  getSalesVolumes() {
    return (this.pdv ? Object.entries(this.pdv.displayIndustrieSaleVolumes()) : []).filter(entry => entry[1] != 0);
  }

  exit() {
    let fn: any;
    this.ref!.nativeElement.addEventListener('transitionend', fn = (_: any) => {
      this.ref!.nativeElement.removeEventListener('transitionend', fn);
    });
    this.pdv = undefined;
  }

  setPage(index: number) {
    this.currentIndex = index % this.pages.length;
  }

  updateSum(row: number, i: number) {
    let sum = 0, diff;
    for ( let j = 0; j < this.grid.length-1; j++ ) {
      sum += this.grid[j+1][i] | 0;
    }
    this.grid[0][i] = sum;
    diff = this.grid[row][0] + this.grid[row][1] + this.grid[row][2] - this.grid[row][3];
    this.grid[row][3] += diff;
    this.grid[0][3] += diff;
    return sum;
  }

  changeRedistributed() {
    this._pdv!.attribute('target')[this.TARGET_REDISTRIBUTED_ID] = !this._pdv!.attribute('target')[this.TARGET_REDISTRIBUTED_ID]
    this.updatePdv(this._pdv!)
  }

  changeTargetP2CD(newTargetP2cd: any) { //PB : newValue isn't a number
    this._pdv!.attribute('target')[this.TARGET_VOLUME_ID] = +newTargetP2cd;
    this.updatePdv(this._pdv!)
    console.log("this : ", this._pdv!.attribute('target'))
  }

  changeComment(newComment: string) { //PB : newValue isn't a number
    this._pdv!.attribute('target')[this.TARGET_COMMENT_ID] = newComment;
    this.updatePdv(this._pdv!)
  }

  changeLight(newLightValue: string) {
    this._pdv!.attribute('target')[this.TARGET_LIGHT_ID] = newLightValue
    this.updatePdv(this._pdv!)
  }

  pdvFromPDVToList(pdv: PDV) { //suitable format to update back, DataExtractionHelper, and then the rest of the application
    let pdvAsList = []
    for(let field of DataExtractionHelper.getPDVFields()) {
      pdvAsList.push(pdv.attribute(field))
    }
    return pdvAsList;
  }

  updatePdv(pdv: PDV) { //Field that may be changed here : target.commentTargetP2CD, target.redistributed, target.greenLight, target.targetP2CD
    let newPdv = this.pdvFromPDVToList(pdv);
    console.log("[InfoBar] newPdv : ", newPdv)
    this.dataService.updatePdv(newPdv);
  }


}
