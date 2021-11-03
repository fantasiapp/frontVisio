import { Component, ElementRef, ViewChild, ChangeDetectorRef } from '@angular/core';
import { FiltersStatesService } from 'src/app/filters/filters-states.service';
import { PDV, SliceDice } from 'src/app/middle/Slice&Dice';
import { SliceTable } from 'src/app/middle/SliceTable';
import { BasicWidget } from '../BasicWidget';

import { AsyncSubject, Observable, Subject} from 'rxjs';
import { EditCellRenderer, CheckboxP2cdCellRenderer, CheckboxEnduitCellRenderer, PointFeuCellRenderer, NoCellRenderer, TargetCellRenderer, InfoCellRenderer, AddArrowCellRenderer } from './renderers';
import { InfoBarComponent } from 'src/app/map/info-bar/info-bar.component';
import DEH from 'src/app/middle/DataExtractionHelper';

@Component({
  selector: 'app-table',
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.css'],
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
  rowData: {[field: string]: any}[] = [];
  rowHeight?: number;

  //Side menus
  pdv?: PDV;
  redistributed: boolean = false;
  selectedPdv?: any;
  hasChanged: boolean = false;
  quiting: boolean = false;
  customData: {[field: string]: any} = {};

  //Apis
  gridApi: any;
  columnApi: any;
  onGridReady = (params: any) => {
    this.gridApi = params.api;
    this.columnApi = params.columnApi;
    this.gridObservable.subscribe(() => {
      this.currentOpt = this.sliceTable.getNavIds(this.type)[0];
      this.updateGraph(this.updateData());
      this.gridLoaded.next(null);
      this.gridLoaded.complete();
    });
  }
  gridObservable = new Observable();
  gridLoaded = new AsyncSubject<null>();

  // Render
  rowClassRules = {
    'group-row': 'data.groupRow === true',
    'pdv-displayed-orange': (params: any) =>  {if(params.data['groupRow'] || this.type == 'enduit') return false;if(this.sliceTable.getRowColor(params.data) == 'orange') return true; return false;},
    'pdv-displayed-red': (params: any) =>  {if(params.data['groupRow'] || this.type == 'enduit') return false; if(this.sliceTable.getRowColor(params.data) == 'red') return true; return false;}
  }
  frameworkComponents = {
    editCellRenderer: EditCellRenderer,
    checkboxP2cdCellRenderer: CheckboxP2cdCellRenderer,
    checkboxEnduitCellRenderer: CheckboxEnduitCellRenderer,
    pointFeuCellRenderer: PointFeuCellRenderer,
    noCellRenderer: NoCellRenderer,
    targetCellRenderer: TargetCellRenderer,
    infoCellRenderer: InfoCellRenderer,
    addArrowCellRenderer: AddArrowCellRenderer,
  };

  constructor(protected ref: ElementRef, protected filtersService: FiltersStatesService, protected sliceDice: SliceDice, protected sliceTable: SliceTable, private cd: ChangeDetectorRef) {
    super(ref, filtersService, sliceDice);
    this.defaultColDef = {
      flex: 1,
      editable: false,
      resizable: false,
      suppressMovable: true,
    };
    this.rowHeight = 45;
  }

  
  start(): void {
    this.gridObservable = new Observable((observer) => {
      observer.next()
    });
  }

  refresh() {
    // this.gridApi.refreshCells()
    this.gridApi.redrawRows()
    this.updateTitle()
  }

  updateData(): any[] {
    this.type = this.properties.arguments[2];
    return this.sliceTable.getData(this.path, this.currentOpt, this.type);
  }

  createData(): any[] {
    this.type = this.properties.arguments[2];
    return this.sliceTable.getData(this.path, this.currentOpt, this.type);
  }

  updateGraph(data: any[]): void {
    this.createGraph(data)
  }

  updateGroups(id: string) {
    this.currentOpt = id;
    this.gridApi.setRowData(this.sliceTable.buildGroups(id, this.type))
    groupInfos = this.sliceTable.groupInfos;
    hiddenGroups = {}
  }

  updateTitle() {
    let title = this.sliceTable.getTitleData();
    if(this.type === 'p2cd') this.title = `PdV: ${title[0]}, Siniat : ${Math.round(title[1]/1000).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}, sur un total identifié de ${Math.round(title[2]/1000).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} en Km²`;
    if(this.type === 'enduit') this.title = `PdV: ${title[0]}, ciblé : ${Math.round(title[1]/1000).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} Tonnes, sur un potentiel de ${Math.round(title[2]/1000).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} en Tonnes`
    this.titleContainer!.nativeElement.innerText = this.title
  }


  createGraph(data: any[], opt?: {}): void {
    this.gridApi.setColumnDefs(this.updateCellRenderer(data[0]));
    this.navOpts = data[2];
    this.updateTitle()
    groupInfos = data[3][0];
    hiddenGroups = {}
    this.rowData = data[1]
    this.gridApi.setRowData(this.rowData)
    this.gridApi.refreshCells()  }


  updateCellRenderer(data: any[]): any[] {
        for(let cd of data){
          switch (cd.field) {
            case 'name':
              cd.valueFormatter = function (params: any) {
                if(params.data.groupRow === true) return DEH.getNameOfRegularObject(SliceTable.currentGroupField, params.value['name']) + ' PdV : ' + params.value['number']
                return;
              }
              break;
            case 'siniatSales':
              cd.valueFormatter = function (params: any) {
                if(params.data.groupRow === true) return 'Siniat : ' + Math.round(params.value/1000).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + " km²";
                return Math.round(params.value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')  + " m²";
              }
              break;

            case 'totalSales':
              cd.valueFormatter = function (params: any) {
                if(params.data.groupRow === true) return 'Identifie : ' + Math.round(params.value/1000).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + " km²";
                else return Math.round(params.value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')  + " m²";
              }
              break;

            case 'edit':
              cd.cellRendererSelector = function (params: any) {
                if(params.data.groupRow === true) return {component: 'noCellRenderer'}
                return {component : 'editCellRenderer'};;
              }
              break;
            
            case 'checkboxP2cd':
              cd.cellRendererSelector = function (params: any) {
                if(params.data.groupRow === true) return {component: 'noCellRenderer'}
                return {component : 'checkboxP2cdCellRenderer'};
              }

              break;

            case 'targetFinition':
              cd.cellRendererSelector = function (params: any) {
                if(params.data.groupRow === true) return {component: 'addArrowCellRenderer'}
                return {component : 'checkboxEnduitCellRenderer'};
              }

              break;
            
            case 'pointFeu':
              cd.cellRendererSelector = function (params: any) {
                if(params.data.groupRow === true) return {component: 'addArrowCellRenderer'}
                return {component : 'pointFeuCellRenderer'};
              }
              break;
            
            case 'graph':
              cd.valueFormatter = function (params: any) {
                if(params.data.groupRow ===  true) return "Cible : " + Math.round(params.value/1000).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + " T"
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
                if(params.data.groupRow === true) return 'Sur un potentiel de: ' + Math.round(params.value / 1000).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' T'
                return Math.round(params.value / 1000).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' T'
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
    console.log("Data : ", event['data'], event)
    if(event['data'].groupRow === true) {
      this.externalFilterChanged(event['data'].name.name)
      let arrowImg = document.getElementById(event['node'].data.name.name);
      if(arrowImg?.style.transform == "rotate(-0.5turn)") arrowImg!.style.transform = "rotate(0turn)";
      else arrowImg!.style.transform = "rotate(-0.5turn)"
    } else {
      if(event['column']['colId'] === 'edit' || event['column']['colId'] === 'info') {
        this.displayInfobar(event['data'])
      }
      if(event['column']['colId'] === 'checkboxEnduit') {
        this.updateTitle()
      }
    }
  }

  getPdvOnId(id: number): {[key:string]:any} {
    for(let pdv of this.rowData) {
      if(pdv.instanceId === id) return pdv;
    }
    return this.rowData[0];
  }

  displayInfobar(pdv: PDV | number) {
    if(typeof(pdv) === 'number') { pdv = PDV.findById(pdv)!;}
    this.selectedPdv = pdv;
    this.pdv = PDV.getInstances().get(pdv.id) // => displays infoBar
    this.cd.markForCheck();
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
    return !hiddenGroups[node.data[groupInfos.field]] === true;

    // try {
    //   return !hiddenGroups[node.data[groupInfos.field]] === true;
    // } catch {
    //   return true;
    // }
  }
}

//for an unknown reason, only works if this variables are outside the class (next time, try them as public)
var hiddenGroups: {[field: string]: boolean} = {};
var groupInfos: {field: string, values: string[]} = {field : '', values: []};