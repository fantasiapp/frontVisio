import { Component, ElementRef, EventEmitter, HostBinding, Input, Output, ViewChild } from '@angular/core';
import DataExtractionHelper from 'src/app/middle/DataExtractionHelper';
import { PDV } from 'src/app/middle/Slice&Dice';

@Component({
  selector: 'info-bar',
  templateUrl: './info-bar.component.html',
  styleUrls: ['./info-bar.component.css']
})
export class InfoBarComponent {
  @HostBinding('class.opened')
  private opened: boolean = false;

  @ViewChild('comments', {static: false, read: ElementRef})
  private comment?: ElementRef;
  
  @Output()
  close: EventEmitter<boolean> = new EventEmitter();
  
  @Input()
  set pdv(value: PDV | undefined) {
    this._pdv = value;
    this.opened = value ? true : false;
    this.pdvChange.emit(value);
    if ( this.comment )
      this.comment.nativeElement.value = '';
  }

  @Output()
  pdvChange = new EventEmitter<PDV | undefined>();

  pages: string[] = ['Référentiel', 'Ciblage', 'Saisie de l\'AD'];
  currentIndex: number = 0;

  industries: string[] = (PDV.getIndustries() as string[]);
  products: string[] = PDV.getProducts() as string[];
  grid: number[][] = [];

  get pdv() {
    return this._pdv;
  }

  private _pdv: PDV | undefined;

  
  //HACK
  getName: any = DataExtractionHelper.getNameOfRegularObject.bind(DataExtractionHelper);

  constructor(private ref: ElementRef) {
    console.log('[InfobarComponent]: On');
    this.products.splice(3, this.products.length, 'P2CD')
    this.grid = new Array(this.industries.length + 1);
    for ( let i = 0; i < this.grid.length; i++ )
      this.grid[i] = new Array(this.products.length).fill(0);
  }

  exit() {
    let fn: any;
    this.ref!.nativeElement.addEventListener('transitionend', fn = (_: any) => {
      this.close.emit(true);
      this.ref!.nativeElement.removeEventListener('transitionend', fn);
    });
    this.pdv = undefined;
  }

  setPage(index: number) {
    this.currentIndex = index;
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
}
