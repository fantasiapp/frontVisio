import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FiltersStatesService } from 'src/app/filters/filters-states.service';
import { SliceDice } from 'src/app/middle/Slice&Dice';
import { SliceTable } from 'src/app/middle/SliceTable';
import { BasicWidget } from '../BasicWidget';

import { Observable} from 'rxjs';
import { EditCellRenderer, CheckboxCellRenderer, PointFeuCellRenderer, NoCellRenderer, TargetCellRenderer, InfoCellRenderer } from './renderers';

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
    console.log("ready")
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
    editCellRenderer: EditCellRenderer,
    checkboxCellRenderer: CheckboxCellRenderer,
    pointFeuCellRenderer: PointFeuCellRenderer,
    noCellRenderer: NoCellRenderer,
    targetCellRenderer: TargetCellRenderer,
    infoCellRenderer: InfoCellRenderer,
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
    this.updateTitle()
    this.pinnedRow = data[1][0]; //Hardest part
    groupInfos = data[3][0];
    hiddenGroups = {}
  }

  updateGroups(id: string) {
    this.currentOpt = id;
    this.gridApi.setRowData(this.sliceTable.buildGroups(id, this.type))
    groupInfos = this.sliceTable.groupInfos;
    hiddenGroups = {}
  }

  updateTitle() {
    console.log("Title update")
    let title = this.sliceTable.getTitleData();
    if(this.type === 'p2cd') this.title = `PdV: ${title[0]} Siniat : ${(title[1]).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} sur un total identifié de ${title[2].toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} en Km²`;
    if(this.type === 'enduit') this.title = `PdV: ${title[0]} ciblé : ${Math.floor(title[1]/1000).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} Tonnes, sur un potentiel de ${title[2].toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} en Tonnes`
    this.titleContainer!.nativeElement.innerText = this.title
  }


  createGraph(data: any[], opt?: {}): void {
    throw new Error('Method not implemented.');
  }


  updateCellRenderer(data: any[]): any[] {
        for(let cd of data){
          switch (cd.field) {
            case 'name':

              cd.valueFormatter = function (params: any) {
                if(params.data.groupRow) return params.value['name'] + ' PdV : ' + params.value['number']
                return params.value;
              }
              break;
            case 'siniatSales':
              cd.valueFormatter = function (params: any) {
                if(params.data.groupRow === true) return 'Siniat : ' + Math.floor(params.value/1000).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + " km²";
                return Math.floor(params.value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')  + " m²";
              }
              break;

            case 'totalSales':
              cd.valueFormatter = function (params: any) {
                if(params.data.groupRow === true) return 'Identifie : ' + Math.floor(params.value/1000).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + " km²";
                else return Math.floor(params.value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')  + " m²";
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
              cd.valueFormatter = function (params: any) {
                if(params.data.groupRow ===  true) return "Cible : " + Math.floor(params.value/1000).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + " T"
                return params.value;
              }
              cd.cellRendererSelector = function (params: any) {
                if(params.data.groupRow !== true) return {component: 'targetCellRenderer'};
                return;
              }
              break;
            
            case 'info':
              cd.cellRendererSelector = function (params: any) {
                if(params.data.groupRow === true) return {component: 'noCellRenderer'}
                return {component : 'infoCellRenderer'};
              }
              break;
            
            case 'potential':
              cd.valueFormatter = function (params: any) {
                if(params.data.groupRow === true) return 'Sur un potentiel de: ' + Math.floor(params.value / 1000).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' T'
                return Math.floor(params.value / 1000).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' T'
              }
              break;
            case 'nbVisits':
              cd.valueFormatter = function (params: any) {
                if(params.data.groupRow === true) return;
                return params.value + ' V'
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
      this.externalFilterChanged(event['data'].name.name)
    }
    console.log("Toggle ", event)
    if(event['column']['colId'] === 'checkbox') this.updateTitle()
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
    if (hiddenGroups[value] === true) delete hiddenGroups[value];
    else hiddenGroups[value] = true;
    this.gridApi.onFilterChanged();
  }

  isExternalFilterPresent() {
    return Object.keys(hiddenGroups).length > 0
  }

  doesExternalFilterPass(node: any) {
    if(node.data.groupRow == true) return true;
    try {
      return !hiddenGroups[node.data[groupInfos.field]] === true;
    } catch {
      return true;
    }
  }

}

//for an unknown reason, only works if this variables are outside the class (next time, try them as public)
var hiddenGroups: {[field: string]: boolean} = {};
var groupInfos: {field: string, values: string[]} = {field : '', values: []};