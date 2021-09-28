import { Component } from "@angular/core";
import { AgRendererComponent } from "ag-grid-angular";
import { ICellRendererParams } from "ag-grid-community";

@Component({
    selector: 'sales-component',
    template: `<span>{{ this.displayValue }}</span>`,
  })
  export class RowSalesCellRenderer implements AgRendererComponent {
    
    refresh(params: ICellRendererParams): boolean {
      return true;
    }
    displayValue: string = "";
  
    agInit(params: ICellRendererParams): void {
      this.displayValue = Math.floor(params.value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')  + " m²";
    }
  }
  
  @Component({
    selector: 'total-sales-component',
    template: `<span>{{ this.displayValue }}</span>`,
  })
  export class GroupSalesCellRenderer implements AgRendererComponent {
    
    refresh(params: ICellRendererParams): boolean {
      return true;
    }
    displayValue: string = "";
  
    agInit(params: ICellRendererParams): void {
      this.displayValue = (<any>params).text as string + Math.floor(params.value/1000).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') as string + " km²";
    }
  }
   
  @Component({
    selector: 'edit-component',
    template: `<img src="/assets/edit.svg" (click)="showEdit()"/>`,
    styles:  [`:host {
        display: flex;
        justify-content: center;
        align-items: center;
      }`]
  })
  export class EditCellRenderer implements AgRendererComponent {
    
    refresh(params: ICellRendererParams): boolean {
      return true;
    }
    show: boolean = true;
    agInit(params: ICellRendererParams): void {}

    showEdit(){this.show = !this.show; console.log("Toggle edit")}
  }
  
  @Component({
    selector: 'checkbox-component',
    template: `<input type="checkbox">`,
    styles:  [`:host {
        display: flex;
        justify-content: center;
        align-items: center;
      }`]
  })
  export class CheckboxCellRenderer implements AgRendererComponent {
    
    refresh(params: ICellRendererParams): boolean {
      return true;
    }
  
    agInit(params: ICellRendererParams): void {
    }
  }
  
  @Component({
    selector: 'point-feu-component',
    template: `<img *ngIf="show" src="/assets/feu.svg">`,
    styles:  [`:host {
        display: flex;
        justify-content: center;
        align-items: center;
      }`]
  })
  export class PointFeuCellRenderer implements AgRendererComponent {
    
    refresh(params: ICellRendererParams): boolean {
      return true;
    }
    show: boolean = false;
  
    agInit(params: ICellRendererParams): void {
      this.show = params.value;
    }
  }

  @Component({
    selector: 'target-component',
    template: `
        <div [ngStyle]="{'display': 'flex', 'flex-direction': 'column', 'height': 'auto'}">
            <div [ngStyle]="{'display': 'flex', 'flex-direction': 'row', 'height': '25px'}">
                <div *ngFor="let sale of p2cd" [ngStyle]="{'background-color': sale.color, 'color': sale.color, 'flex-grow': sale.value }">
                    .
                </div>
            </div>

            <div [ngStyle]="{'display': 'flex', 'flex-direction': 'row', 'height': '25px'}">
                <div *ngFor="let sale of enduit" [ngStyle]="{'background-color': sale.color, 'color': sale.color, 'flex-grow': sale.value }">
                    .
                </div>
            </div>
        </div>`,
  })
  export class TargetCellRenderer implements AgRendererComponent {
    
    refresh(params: ICellRendererParams): boolean {
      return true;
    }
    p2cd?: {[name: string]: number}[];
    enduit?: {[name: string]: number}[];

    agInit(params: ICellRendererParams): void {
        this.p2cd = params.value['p2cd'];
        this.enduit = params.value['enduit'];

    }
  }



  @Component({
    selector: 'no-component',
    template: ``,
  })
  export class NoCellRenderer implements AgRendererComponent {
    
    refresh(params: ICellRendererParams): boolean {
      return true;
    }
  
    agInit(params: ICellRendererParams): void {
    }
  }
  