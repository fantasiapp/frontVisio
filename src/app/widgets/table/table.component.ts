import { Component, ElementRef, ViewChild, ChangeDetectorRef } from '@angular/core';
import { FiltersStatesService } from 'src/app/filters/filters-states.service';
import { PDV, SliceDice } from 'src/app/middle/Slice&Dice';
import { SliceTable, TableData } from 'src/app/middle/SliceTable';
import { BasicWidget } from '../BasicWidget';

import { AsyncSubject, Observable } from 'rxjs';
import { EditCellRenderer, CheckboxP2cdCellRenderer, CheckboxEnduitCellRenderer, PointFeuCellRenderer, NoCellRenderer, TargetCellRenderer, InfoCellRenderer, AddArrowCellRenderer } from './renderers';
import DEH from 'src/app/middle/DataExtractionHelper';

@Component({
  selector: 'app-table',
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.css'],
})
export class TableComponent extends BasicWidget {

  @ViewChild('title', {static: false, read: ElementRef})
  private titleContainer?: ElementRef;
  
  //p2cd or enduit
  type: string = 'p2cd';

  //Navigation menu
  navOpts: any;
  currentOpt: any;

  //Columns
  defaultColDef: any;
  columnDefs: any;

  //Rows
  rowData: PDV[] = [];
  rowHeight?: number;

  //Side menus
  pdv?: PDV;
  redistributed: boolean = false;
  selectedPdv?: any;
  hasChanged: boolean = false;
  quiting: boolean = false;

  //Apis
  gridApi: any;
  columnApi: any;
  onGridReady = (params: any) => {
    this.gridApi = params.api;
    this.columnApi = params.columnApi;
    this.gridObservable.subscribe(() => {
      this.currentOpt = this.sliceTable.getNavIds(this.type)[0];
      this.createGraph(this.createData());
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
    this.gridApi.redrawRows()
    this.computeTitle()
  }

  update() { //could be smoother ?
    this.createGraph(this.createData())
  }

  createGraph(data: TableData): void {
    this.columnDefs = this.setupCellRenderers(data.columnDefs);
    this.navOpts = data.navOpts;
    groupInfos = data.colInfos;
    hiddenGroups = {}
    this.rowData = data.pdvs
    this.computeTitle()
  }

  createData(): TableData {
    this.type = this.properties.arguments[2];
    SliceTable.currentGroupField = this.currentOpt;
    return this.sliceTable.getData(this.path, this.type);
  }


  updateGroups(id: string) {
    this.currentOpt = id;
    SliceTable.currentGroupField = this.currentOpt;
    this.gridApi.setRowData(this.sliceTable.buildGroups(this.type))
    groupInfos = this.sliceTable.groupInfos;
    hiddenGroups = {}
  }

  computeTitle() {
    let titleData = this.sliceTable.computeTitle(this.type);
    if(this.type === 'p2cd') this.titleContainer!.nativeElement.innerText = `PdV: ${BasicWidget.format(titleData[0])}, Siniat : ${BasicWidget.format(titleData[1]/1000)}, sur un total identifié de ${BasicWidget.format(titleData[2]/1000)} en Km²`;
    if(this.type === 'enduit') this.titleContainer!.nativeElement.innerText = `PdV: ${BasicWidget.format(titleData[0])}, ciblé : ${BasicWidget.format(titleData[1]/1000, 3, true)} Tonnes, sur un potentiel de ${BasicWidget.format(titleData[2]/1000)} en Tonnes`
  }

  setupCellRenderers(columnDefs: any[]): any[] { //If necessary, sets the cellRenderer, or the valueFormatter of the column
        for(let cd of columnDefs){
          switch (cd.field) {
            case 'name':
              cd.valueFormatter = function (params: any) {
                if(params.data.groupRow === true) return DEH.getNameOfRegularObject(SliceTable.currentGroupField, params.value['name']) + ' PdV : ' + params.value['number']
                return;
              }
              break;

            case 'siniatSales':
              cd.valueFormatter = function (params: any) {
                if(params.data.groupRow === true) return 'Siniat : ' + BasicWidget.format(params.value/1000, 3, true) + " km²";
                return BasicWidget.format(params.value/1000, 3, true)  + " m²";
              }
              break;

            case 'totalSales':
              cd.valueFormatter = function (params: any) {
                if(params.data.groupRow === true) return 'Identifie : ' + BasicWidget.format(params.value/1000, 3, true) + " km²";
                else return BasicWidget.format(params.value/1000, 3, true)  + " m²";
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
                if(params.data.groupRow ===  true) return "Cible : " + BasicWidget.format(params.value/1000, 3, true) + " T"
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
                if(params.data.groupRow === true) return 'Sur un potentiel de: ' + BasicWidget.format(params.value/1000, 3, true) + ' T'
                return BasicWidget.format(params.value/1000, 3, true) + ' T'
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
    return columnDefs;
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
    }
  }

  displayInfobar(pdv: PDV | number) {
    if(typeof(pdv) === 'number') { pdv = PDV.findById(pdv)!;}
    this.selectedPdv = pdv;
    this.pdv = PDV.findById(pdv.id) // => displays infoBar
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
  }
}

//for an unknown reason, only works if this variables are outside the class (next time, try them as public)
var hiddenGroups: {[field: string]: boolean} = {};
var groupInfos: {field: string, values: string[]} = {field : '', values: []};