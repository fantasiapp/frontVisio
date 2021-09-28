import { Component, ElementRef, OnInit } from '@angular/core';
import { FiltersStatesService } from 'src/app/filters/filters-states.service';
import { SliceDice } from 'src/app/middle/Slice&Dice';
import { SliceTable } from 'src/app/middle/SliceTable';
import { BasicWidget } from '../BasicWidget';

import { Observable} from 'rxjs';
import { RowSalesCellRenderer, GroupSalesCellRenderer, EditCellRenderer, CheckboxCellRenderer, PointFeuCellRenderer } from './renderers';

@Component({
  selector: 'app-table',
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.css'],
  providers: [SliceDice],
})
export class TableComponent extends BasicWidget {

  private content!: ElementRef;
  titleData: number[] = [0,0,0];

  //p2cd or enduit
  type: string = 'p2cd';

  //Navigation menu
  navOpts: any;
  currentOpt: any;

  //Columns
  defaultColDef: any;
  columnDefs: any;

  //Rows
  rowData: any;
  rowHeight?: number;

  //Groups
  groupDisplayType: any;
  groupDefaultExpanded?: number;

  //Apis
  gridApi: any;
  columnApi: any;
  onGridReady = (params: any) => {
    this.gridApi = params.api;
    this.columnApi = params.columnApi;
    this.gridObservable.subscribe(() => {
      this.currentOpt = this.sliceTable.getNavIds(this.type)[0];
      this.updateGraph(this.updateData());
      })
  }
  gridObservable = new Observable();

  // Render
  pinnedRow?: {}[];
  rowClassRules = {
    'group-row': 'data.groupRow === true'
  }
  frameworkComponents = {
    rowSalesCellRenderer: RowSalesCellRenderer,
    groupSalesCellRenderer: GroupSalesCellRenderer,
    editCellRenderer: EditCellRenderer,
    checkboxCellRenderer: CheckboxCellRenderer,
    pointFeuCellRenderer: PointFeuCellRenderer,
  };

  constructor(protected ref: ElementRef, protected filtersService: FiltersStatesService, protected sliceDice: SliceDice, protected sliceTable: SliceTable) {
    super(ref, filtersService, sliceDice);
    this.defaultColDef = {
      flex: 1,
      editable: false,
      resizable: false,
      suppressMovable: true,
    };
    this.rowHeight = 45;
  }

  
  protected start(): void {
    this.gridObservable = new Observable((observer) => {
      observer.next()
    })
  }

  updateData(): any[] {
    this.type = this.properties.arguments[2];
    return this.sliceTable.getData(this.path, this.currentOpt, this.type);
  }

  updateGraph(data: any[]): void {
    data[0] = this.updateCellRenderer(data[0]);
    this.gridApi.setColumnDefs(data[0]);
    this.gridApi.setRowData(data[1]);
    this.navOpts = data[2];
    this.titleData = data[3];

    this.pinnedRow = data[1][0]; //Hardest part
  }

  updateGroups(id: string) {
    this.currentOpt = id;
    this.gridApi.setRowData(this.sliceTable.buildGroups(id))
  }

  createGraph(data: any[], opt?: {}): void {
    throw new Error('Method not implemented.');
  }


  updateCellRenderer(data: any[]): any[] {
        for(let cd of data){
          switch (cd.field) {

            case 'siniatSales':
              cd.cellRendererSelector = function (params: any) {
                const rowSalesDetails = {component: 'rowSalesCellRenderer'};
                const groupSalesDetails = {component: 'groupSalesCellRenderer', params: {text: "Siniat : "}}
                
                if(params.data.groupRow === true) return groupSalesDetails;
                else return rowSalesDetails;
              }
              break;

            case 'totalSales':
              cd.cellRendererSelector = function (params: any) {
                const rowSalesDetails = {component: 'rowSalesCellRenderer'};
                const groupSalesDetails = {component: 'groupSalesCellRenderer', params : {text: "Identifie : "}}
                
                if(params.data.groupRow === true) return groupSalesDetails;
                else return rowSalesDetails;
              }
              break;

            case 'edit':
              cd.cellRendererSelector = function (params: any) {
                const editDetails = {component : 'editCellRenderer'};
                return editDetails;
              }
              break;
            
            case 'checkbox':
              cd.cellRendererSelector = function (params: any) {
                const checkboxDetails = {component : 'checkboxCellRenderer'};
                return checkboxDetails;
              }
              break;
            
            case 'pointFeu':
              cd.cellRendererSelector = function (params: any) {
                const pointFeuDetails = {component : 'pointFeuCellRenderer'};
                return pointFeuDetails;
              }
              break;

            default:
              break;
          }
        }
    return data;
  }

}