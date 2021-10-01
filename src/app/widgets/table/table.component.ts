import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
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
  @ViewChild('title', {static: false, read: ElementRef})
  private titleContainer?: ElementRef;

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
    this.gridApi.setColumnDefs(this.updateCellRenderer(data[0]));
    this.gridApi.setRowData(data[1]);
    this.navOpts = data[2];
    if(this.type === 'p2cd') this.title = `PdV: ${data[3][0]} Siniat : ${data[3][1].toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} sur un total identifié de ${data[3][2].toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} en Km²`;
    if(this.type === 'enduit') this.title = `PdV: ${data[3][0]} ciblé : ${data[3][1].toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} Tonnes, sur un potentiel de ${data[3][2].toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} en Tonnes`
    this.pinnedRow = data[1][0]; //Hardest part
    this.titleContainer!.nativeElement.innerText = this.title;

    groupInfos = data[4][0];
    displayedGroups = {}
    for(let value of groupInfos.values) displayedGroups[value] = true;
  }

  updateGroups(id: string) {
    this.currentOpt = id;
    this.gridApi.setRowData(this.sliceTable.buildGroups(id, this.type))
    groupInfos = this.sliceTable.groupInfos;
    displayedGroups = {}
    for(let value of groupInfos.values) displayedGroups[value] = true;
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
                if(params.data.groupRow === true) return {component: 'groupTargetCellRenderer'};
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
    if(event['column']['colId'] === 'edit') this.showEditOnClick(event['data']);
    if(event['column']['colId'] === 'info') this.showInfoOnClick(event['data']);
    if(event['column']['colId'] === 'target') console.log("Data : ", event['data'], event)
    if(event['data'].groupRow === true) {
      console.log("Toggle ", event['data'].name.name)
      this.externalFilterChanged(event['data'].name.name)
    }
  }

  showEdit: boolean = false;
  editData: any = {}
  showEditOnClick(data: any = {}) {
    if(this.showEdit) {this.showEdit = false; return}
    this.showEdit = true;
    this.editData = {
      'name': data.name,
      'agent': data.agent,
      'segment': data.segmentMarketing,
      'enseigne': data.enseigne,
      'ensemble': data.ensemble,
      'dep': data.dep,
      'ville': data.ville,
      'bassin': data.bassin,
    }
  }

  showInfo: boolean = false;
  infoData: any = {}
  showInfoOnClick(data: any = {}) {
    if(this.showInfo) {this.showInfo = false; return}
    this.showInfo = true
    this.infoData = {
      'name': data.name,
      'enseigne': data.enseigne,
      'dep': data.dep,
      'typologie': data.typologie,
      'segmentMarketing': data.segmentMarketing,
      'segmentCommercial': data.segmentCommercial,
      'nbVisits': data.nbVisits,
      'siniatP2cdSales': Math.floor(data.target.p2cd['Siniat'].value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' '),
      'placoP2cdSales': Math.floor(data.target.p2cd['Placo'].value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' '),
      'knaufP2cdSales': Math.floor(data.target.p2cd['Knauf'].value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' '),
      'totalP2cdSales': Math.floor(data.target.p2cd['Siniat'].value + data.target.p2cd['Placo'].value + data.target.p2cd['Knauf'].value + data.target.p2cd['Autres'].value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' '),
      'pregyEnduitSales': Math.floor(data.target.enduit['Pregy'].value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' '),
      'salsiEnduitSales': Math.floor(data.target.enduit['Salsi'].value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' '),
      'potential': Math.floor(data.potential).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' '),
      'totalEnduitSales': Math.floor(data.target.enduit['Pregy'].value + data.target.enduit['Salsi'].value + data.potential).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' '),
    };
  }

  externalFilterChanged(value: any) {
    displayedGroups[value] = !displayedGroups[value];
    this.gridApi.onFilterChanged();
  }

  isExternalFilterPresent() {
    return Object.values(displayedGroups).includes(false);
  }

  doesExternalFilterPass(node: any) {
    if(node.data.groupRow == true) return true;
    try {
      return displayedGroups[node.data[groupInfos.field]] === true;
    } catch {
      return true;
    }
  }

}

//for an unknown reason, only works if this variables are outside the class (next time, try them as public)
var displayedGroups: {[field: string]: boolean} = {};
var groupInfos: {field: string, values: string[]} = {field : '', values: []};