import { Component } from "@angular/core";
import { AgRendererComponent } from "ag-grid-angular";
import { ICellRendererParams } from "ag-grid-community";
import { SliceTable } from "src/app/middle/SliceTable";

abstract class DefaultCellRenderer implements AgRendererComponent {
  refresh(params: ICellRendererParams): boolean {
    return true;
  }
  agInit(params: ICellRendererParams): void {
  }

}
   
  @Component({
    template: `<div><img src="assets/edit.svg"/></div>`,
    styles:  [`:host {
      flex: 1;
      display: flex;
    }`,
    `div {
      flex: 1;
      display: flex;
      justify-content: center;
      align-items: center;
    }`]
  })
  export class EditCellRenderer extends DefaultCellRenderer {
    agInit(params: ICellRendererParams): void {}
  }
  
  @Component({
    template: `<div><input type="checkbox"  (click)="checkedHandler($event)" [checked]="params.data.checkboxEnduit" [hidden]="!params.data.redistributedEnduit"></div>`,
    styles:  [`:host {
      flex: 1;
      display: flex;
    }`,
    `div {
      flex: 1;
      display: flex;
      justify-content: center;
      align-items: center;
    }`,
    `input {
      transform: scale(1.3);
    }`]
  })
  export class CheckboxEnduitCellRenderer extends DefaultCellRenderer {
    params: any;
    constructor(private sliceTable: SliceTable) {
      super();
    }
    agInit(params: ICellRendererParams): void {
      this.params = params;
    }
    checkedHandler(event: any) {
      let checked = event.target.checked;
      let colId = this.params.column.colId;
      this.params.node.setDataValue(colId, checked);
      
      if(this.params.data.potential > 0) {
        if(checked) this.sliceTable.updateTotalTarget(this.params.data.potential)
        else this.sliceTable.updateTotalTarget(-this.params.data.potential)
      }
    }
  }
  
  @Component({
    template: `<div><input type="checkbox" [(checked)]="params.value" [hidden]="params.data.clientProspect === 'Client'" disabled></div>`,
    styles:  [`:host {
      flex: 1;
      display: flex;
    }`,
    `div {
      flex: 1;
      display: flex;
      justify-content: center;
      align-items: center;
    }`,
    `input {
      transform: scale(1.3);
    }`]
  })
  export class CheckboxP2cdCellRenderer extends DefaultCellRenderer {
    params: any;
    constructor(private sliceTable: SliceTable) {
      super();
    }
    agInit(params: ICellRendererParams): void {
      this.params = params;
    }
  }

  @Component({
    template: `<div><img *ngIf="show" src="assets/feu.svg"></div>`,
    styles:  [`:host {
      flex: 1;
      display: flex;
    }`,
    `div {
      flex: 1;
      display: flex;
      justify-content: center;
      align-items: center;
    }`]

  })
  export class PointFeuCellRenderer extends DefaultCellRenderer {
    show: boolean = false;
    agInit(params: ICellRendererParams): void {
      this.show = params.value;
    }
  }

  @Component({
    template: `
        <div [ngStyle]="{'display': 'flex', 'flex-direction': 'column', 'align-content': 'flex-start', 'width': '100%', 'height': '100%', 'padding': '2% 0 2% 0'}">
            <div [ngStyle]="{'background-color': defaultColor, 'display': 'flex', 'flex-direction': 'row', 'flex-grow': '1'}">
                <div *ngFor="let sale of p2cd" [ngStyle]="{'background-color': sale.color, 'color': sale.color, 'flex-grow': sale.value, 'flex-shrink': '0'}">
                    <span *ngIf="sale.value"></span>
                </div>
            </div>

            <div [ngStyle]="{'background-color': defaultColor, 'display': 'flex', 'flex-direction': 'row', 'flex-grow': '1', 'width': 100+overflow+'%'}">
                <div *ngFor="let sale of enduit" [ngStyle]="{'background-color': sale.color, 'color': sale.color, 'flex-grow': sale.value, 'flex-shrink': '0' }">
                <span *ngIf="sale.value"></span>
                </div>
            </div>
        </div>`,
    styles:  [`:host {
        display: flex;
        flex-direction: column;
        height: 100%;
      }`]
  })
  export class TargetCellRenderer extends DefaultCellRenderer {
    p2cd?: {[name: string]: number}[];
    enduit?: {[name: string]: number}[];
    overflow: number = 0;
    defaultColor = '#F0F0F0';
    agInit(params: ICellRendererParams): void {
        this.p2cd = Object.values(params.value['p2cd']);
        this.enduit = Object.values(params.value['enduit']);
        if (params.data.potential < 0) this.overflow = 10;
    }
  }

  @Component({
    template: `<div>
                <img [id]="rowId" src="assets/flèche .svg"/>
              </div>`,
      styles:  [`:host {
        flex: 1;
        display: flex;
      }`,
      `div {
        flex: 1;
        display: flex;
        justify-content: center;
        align-items: center;
      }`,
      `img {
        transition: all .2s ease-in;
      }`]
  })
  export class AddArrowCellRenderer extends DefaultCellRenderer {
    rowId: string = "";
    agInit(params: ICellRendererParams): void {
      this.rowId = params.node.data.name.name
    }
  }

  @Component({
    template: `<div><img src="assets/! icon.svg"/></div>`,
    styles:  [`:host {
      flex: 1;
      display: flex;
    }`,
    `div {
      flex: 1;
      display: flex;
      justify-content: center;
      align-items: center;
    }`]
  })
  export class InfoCellRenderer extends DefaultCellRenderer {
    agInit(params: ICellRendererParams): void {}
  }
  @Component({
    template: ``,
  })
  export class NoCellRenderer extends DefaultCellRenderer {
    agInit(params: ICellRendererParams): void {
    }
  }
  