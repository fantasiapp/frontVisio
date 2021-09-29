import { Component, ElementRef, OnInit } from '@angular/core';
import { FiltersStatesService } from 'src/app/filters/filters-states.service';
import { SliceDice } from 'src/app/middle/Slice&Dice';
import { SliceTable } from 'src/app/middle/SliceTable';
import { BasicWidget } from '../BasicWidget';

import { Observable} from 'rxjs';
import { RowSalesCellRenderer, GroupSalesCellRenderer, EditCellRenderer, CheckboxCellRenderer, PointFeuCellRenderer, NoCellRenderer, TargetCellRenderer, GroupNameCellRenderer, InfoCellRenderer, PotentialCellRenderer, GroupPotentialCellRenderer, VisitsCellRenderer, GroupTargetCellRenderer } from './renderers';

@Component({
  selector: 'app-table',
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.css'],
  providers: [SliceDice],
})
export class TableComponent extends BasicWidget {

  private content!: ElementRef;
  title: string = "";
  
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
    noCellRenderer: NoCellRenderer,
    targetCellRenderer: TargetCellRenderer,
    groupTargetCellRenderer: GroupTargetCellRenderer,
    groupNameCellRenderer: GroupNameCellRenderer,
    infoCellRenderer: InfoCellRenderer,
    potentialCellRenderer: PotentialCellRenderer,
    groupPotentialCellRenderer: GroupPotentialCellRenderer,
    visitsCellRenderer: VisitsCellRenderer,
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
    if(this.type === 'p2cd') this.title = `PdV: ${data[3][0]} Siniat : ${data[3][1]} sur un total identifié de ${data[3][2]} en Km²`;
    if(this.type === 'enduit') this.title = `PdV: ${data[3][0]} ciblé : ${data[3][1]} Tonnes, sur un potentiel de ${data[3][2]} en Tonnes`
    this.pinnedRow = data[1][0]; //Hardest part
  }

  updateGroups(id: string) {
    this.currentOpt = id;
    this.gridApi.setRowData(this.sliceTable.buildGroups(id, this.type))
  }

  createGraph(data: any[], opt?: {}): void {
    throw new Error('Method not implemented.');
  }


  updateCellRenderer(data: any[]): any[] {
        for(let cd of data){
          switch (cd.field) {
            case 'name':
              cd.cellRendererSelector = function (params: any) {
                const groupNameDetails = {component : 'groupNameCellRenderer'};
                if(params.data.groupRow === true) return groupNameDetails;
                return;
              }
              break;
            case 'siniatSales':
              cd.cellRendererSelector = function (params: any) {
                if(params.data.groupRow === true) return {component: 'groupSalesCellRenderer', params: {text: "Siniat : "}};
                else return {component: 'rowSalesCellRenderer'};
              }
              break;

            case 'totalSales':
              cd.cellRendererSelector = function (params: any) {
                if(params.data.groupRow === true) return {component: 'groupSalesCellRenderer', params : {text: "Identifie : "}};
                else return {component: 'rowSalesCellRenderer'};
              }
              break;

            case 'edit':
              cd.cellRendererSelector = function (params: any) {
                if(params.data.groupRow === true) return {component: 'noCellRenderer'}
                return {component : 'editCellRenderer'};;
              }
              break;
            
            case 'checkbox':
              cd.cellRendererSelector = function (params: any) {
                if(params.data.groupRow === true) return {component: 'noCellRenderer'}
                return {component : 'checkboxCellRenderer'};;
              }
              break;
            
            case 'pointFeu':
              cd.cellRendererSelector = function (params: any) {
                if(params.data.groupRow === true) return {component: 'noCellRenderer'}
                return {component : 'pointFeuCellRenderer'};
              }
              break;
            
            case 'target':
              cd.cellRendererSelector = function (params: any) {
                if(params.data.groupRow === true) return {component: 'groupTargetCellRenderer'}
                return {component: 'targetCellRenderer'};
              }
              break;
            
            case 'info':
              cd.cellRendererSelector = function (params: any) {
                if(params.data.groupRow === true) return {component: 'noCellRenderer'}
                return {component : 'infoCellRenderer'};
              }
              break;
            
            case 'potential':
              cd.cellRendererSelector = function (params: any) {
                if(params.data.groupRow === true) return {component: 'groupPotentialCellRenderer'}
                return {component : 'potentialCellRenderer'};
              }
              break;
            case 'nbVisits':
              cd.cellRendererSelector = function (params: any) {
                if(params.data.groupRow === true) return {component: 'noCellRenderer'}
                return {component : 'visitsCellRenderer'};
              }
              break;

            default:
              break;

          }
        }
    return data;
  }

  onCellClicked(event: any) {
    if(event['column']['colId'] === 'edit') this.showEdit(event['data']);
    if(event['column']['colId'] === 'target') console.log("Data : ", event['data'])
  }

  show: boolean = false;
  editData: {} = {}
  showEdit(data: {} = {}) {
    if(this.show) {this.show = false; return}
    this.show = true;
    this.editData = data;
  }

}