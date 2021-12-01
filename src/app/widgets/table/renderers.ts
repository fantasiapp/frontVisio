import { Component } from "@angular/core";
import { AgRendererComponent } from "ag-grid-angular";
import { ICellRendererParams } from "ag-grid-community";
import { PDV } from "src/app/middle/Pdv";
import { SliceTable } from "src/app/middle/SliceTable";

abstract class DefaultCellRenderer implements AgRendererComponent {
  refresh(params: ICellRendererParams): boolean {return true;}
  agInit(params: ICellRendererParams): void {  }
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
  }
  
  @Component({
    template: `<div><input type="checkbox"  (click)="checkedHandler($event)" [checked]="pdv.targetFinition" [hidden]="!pdv.redistributedFinitions || pdv.potential < 0 || pdv.sale === false || pdv.onlySiniat === true || pdv.typology === 4" [conditionnal]="{initialConditions: ['agentFinitionsOnly', 'currentYearOnly']}"></div>`,
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
    pdv!: PDV;
    constructor(private sliceTable: SliceTable) {
      super();
    }
    agInit(params: ICellRendererParams): void {
      this.pdv = params.data;
    }

    checkedHandler(event: any) {this.sliceTable.changeTargetTargetFinitions(this.pdv)}
  }
  
  @Component({
    template: `<div><input type="checkbox" [checked]="pdv.targetP2cd > 0 && pdv.lightTarget != 'r'" [hidden]="pdv.clientProspect === 1" disabled></div>`,
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
    pdv!: PDV;
    agInit(params: ICellRendererParams): void {this.pdv = params.data;}
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
    agInit(params: ICellRendererParams): void {this.show = params.value;}
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
                <div *ngFor="let sale of enduit; let i = index" [ngStyle]="{'background-color': sale.color, 'color': sale.color, 'flex-grow': sale.value, 'flex-shrink': '0' }">
                <span *ngIf="sale.value"></span>
                </div>
            </div>
        </div>`,
    styles:  [`:host {
        display: flex;
        flex-direction: column;
        height: 100%;
      }`,
      `.description {
        position: absolute;
        z-index: 999999;
      }`]
  })
  export class TargetCellRenderer extends DefaultCellRenderer {
    p2cd?: {[name: string]: number}[];
    enduit?: {[name: string]: number}[];
    overflow: number = 0;
    defaultColor = '#F0F0F0';
    id = "";
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
    agInit(params: ICellRendererParams): void {this.rowId = params.node.data.name.name}
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
  export class InfoCellRenderer extends DefaultCellRenderer {}

  @Component({
    template: `<div>Ciblé</div>`,
  })
  export class TargetColumnRenderer extends DefaultCellRenderer {}
  

  @Component({
    template: ``,
  })
  export class NoCellRenderer extends DefaultCellRenderer {}
  