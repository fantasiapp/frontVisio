import { Component } from "@angular/core";
import { AgRendererComponent } from "ag-grid-angular";
import { ICellRendererParams } from "ag-grid-community";

abstract class DefaultCellRenderer implements AgRendererComponent {
  refresh(params: ICellRendererParams): boolean {
    return true;
  }
  agInit(params: ICellRendererParams): void {
  }

}

@Component({
  template: `<span>{{ this.displayValue }}</span>`,
})
export class GroupNameCellRenderer extends DefaultCellRenderer {
  displayValue: string = "";
  agInit(params: ICellRendererParams): void {
    this.displayValue = params.value['name'] + ' PdV : ' + params.value['number']
  }
}

@Component({
    template: `<span>{{ this.displayValue }}</span>`,
  })
  export class RowSalesCellRenderer extends DefaultCellRenderer {
    displayValue: string = "";
    agInit(params: ICellRendererParams): void {
      this.displayValue = Math.floor(params.value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')  + " m²";
    }
  }
  
  @Component({
    template: `<span>{{ this.displayValue }}</span>`,
  })
  export class GroupSalesCellRenderer extends DefaultCellRenderer {
    displayValue: string = "";
    agInit(params: ICellRendererParams): void {
      this.displayValue = (<any>params).text as string + Math.floor(params.value/1000).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') as string + " km²";
    }
  }
   
  @Component({
    template: `<img src="assets/edit.svg"/>`,
    styles:  [`:host {
        display: flex;
        justify-content: center;
        align-items: center;
        top: 25%;
        left: 25%;
        position: relative;
      }`]
  })
  export class EditCellRenderer extends DefaultCellRenderer {
    agInit(params: ICellRendererParams): void {}
  }
  
  @Component({
    template: `<input type="checkbox"  (click)="checkedHandler($event)" [checked]="params.data.checkbox">`,
    styles:  [`:host {
        display: flex;
        justify-content: center;
        align-items: center;
        top: 25%;
        left: 25%;
        position: relative;
      }
      input {
        transform: scale(1.3);
      }
      
      `]
  })
  export class CheckboxCellRenderer extends DefaultCellRenderer {
    params: any;
    agInit(params: ICellRendererParams): void {
      this.params = params;
    }
    checkedHandler(event: any) {
      let checked = event.target.checked;
      let colId = this.params.column.colId;
      this.params.node.setDataValue(colId, checked); 

      // this.params.api.refreshCells();
    }
  }
  
  @Component({
    template: `<img *ngIf="show" src="assets/feu.svg">`,
    styles:  [`:host {
      display: flex;
      justify-content: center;
      align-items: center;
      top: 25%;
      left: 25%;
      position: relative;
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
            <div [ngStyle]="{'display': 'flex', 'flex-direction': 'row', 'flex-grow': '1'}">
                <div *ngFor="let sale of p2cd" [ngStyle]="{'background-color': sale.color, 'color': sale.color, 'flex-grow': sale.value, 'flex-shrink': '0'}">
                    <span *ngIf="sale.value"></span>
                </div>
            </div>

            <div [ngStyle]="{'display': 'flex', 'flex-direction': 'row', 'flex-grow': '1', 'width': 100+overflow+'%'}">
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
    agInit(params: ICellRendererParams): void {
        this.p2cd = Object.values(params.value['p2cd']);
        this.enduit = Object.values(params.value['enduit']);
        if (params.data.potential < 0) this.overflow = 10;
    }
  }

  @Component({
    template: `<div>{{ displayValue }}</div>`,
    styles:  [`:host {
        display: flex;
        justify-content: center;
        align-items: center;
      }`]
  })
  export class GroupTargetCellRenderer extends DefaultCellRenderer {
    displayValue: string = ''
    agInit(params: ICellRendererParams): void {
      console.log("Renderer Params : ", params)
      this.displayValue = "Cible : " + Math.floor(params.value/1000).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + " T"
    }

    refresh(params: ICellRendererParams): boolean {
      this.displayValue = "Cible : " + Math.floor(params.value/1000).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + " T"
      return true;
    }
  }

  @Component({
    template: `<img src="assets/! icon.svg"/>`,
    styles:  [`:host {
        display: flex;
        justify-content: center;
        align-items: center;
        top: 25%;
        left: 25%;
        position: relative;
      }`]
  })
  export class InfoCellRenderer extends DefaultCellRenderer {
    agInit(params: ICellRendererParams): void {}
  }

  @Component({
    template: `<div>{{ potential }}</div>`,
  })
  export class PotentialCellRenderer extends DefaultCellRenderer {
    potential: string  = "";
    agInit(params: ICellRendererParams): void {
      this.potential = Math.floor(params.value / 1000).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' T'
    }
  }

  @Component({
    template: `<div>{{ potential }}</div>`,
  })
  export class GroupPotentialCellRenderer extends DefaultCellRenderer {
    potential: string  = "";
    agInit(params: ICellRendererParams): void {
      this.potential = 'Sur un potentiel de: ' + Math.floor(params.value / 1000).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' T'
    }
  }

  @Component({
    template: `<div>{{ visits }}</div>`,

  })
  export class VisitsCellRenderer extends DefaultCellRenderer {
    visits: string  = "";
    agInit(params: ICellRendererParams): void {
      this.visits = params.value + ' V'
    }
  }

  @Component({
    template: ``,
  })
  export class NoCellRenderer extends DefaultCellRenderer {
    agInit(params: ICellRendererParams): void {
    }
  }
  