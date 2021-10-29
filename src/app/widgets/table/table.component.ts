import { Component, ElementRef, OnInit, ViewChild, HostBinding, ChangeDetectorRef } from '@angular/core';
import { FiltersStatesService } from 'src/app/filters/filters-states.service';
import { PDV, SliceDice } from 'src/app/middle/Slice&Dice';
import { SliceTable } from 'src/app/middle/SliceTable';
import { BasicWidget } from '../BasicWidget';

import { AsyncSubject, Observable, Subject} from 'rxjs';
import { EditCellRenderer, CheckboxP2cdCellRenderer, CheckboxEnduitCellRenderer, PointFeuCellRenderer, NoCellRenderer, TargetCellRenderer, InfoCellRenderer, AddArrowCellRenderer } from './renderers';
import DataExtractionHelper from 'src/app/middle/DataExtractionHelper';
import { InfoBarComponent } from 'src/app/map/info-bar/info-bar.component';
import { LoggerService } from 'src/app/behaviour/logger.service';
import { LoginPageComponent } from 'src/app/login-page/login-page.component';

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

  
  protected start(): void {
    this.gridObservable = new Observable((observer) => {
      observer.next()
    });
  }

  refresh() {
    let newRows =  this.updateData()[1];
    for(let i = 0; i < this.rowData.length; i++) {
      for(let field of Object.keys(this.rowData[i]))
      this.rowData[i][field] = newRows[i][field];
    }
    this.gridApi.refreshCells()
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
    console.log("title updated : ", title)
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
                if(params.data.groupRow === true) return params.value['name'] + ' PdV : ' + params.value['number']
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

            case 'checkboxEnduit':
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
    console.log("TEST : ", this.rowData[1])
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

  loadCustomData() {
    this.customData = {
      'nbVisits': this.selectedPdv.nbVisits,
      'siniatP2cdSales': Math.round(this.selectedPdv.graph.p2cd['Siniat'].value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' '),
      'placoP2cdSales': Math.round(this.selectedPdv.graph.p2cd['Placo'].value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' '),
      'knaufP2cdSales': Math.round(this.selectedPdv.graph.p2cd['Knauf'].value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' '),
      'totalP2cdSales': Math.round(this.selectedPdv.graph.p2cd['Siniat'].value + this.selectedPdv.graph.p2cd['Placo'].value + this.selectedPdv.graph.p2cd['Knauf'].value + this.selectedPdv.graph.p2cd['Autres'].value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' '),
      'pregyEnduitSales': Math.round(this.selectedPdv.graph.enduit['Prégy'].value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' '),
      'salsiEnduitSales': Math.round(this.selectedPdv.graph.enduit['Salsi'].value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' '),
      'potential': Math.round(this.selectedPdv.potential).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' '),
      'totalSiniatEnduitSales': Math.round(this.selectedPdv.potential + this.selectedPdv.graph.enduit['Salsi'].value + this.selectedPdv.graph.enduit['Prégy'].value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' '),
      'totalEnduitSales': Math.round(this.selectedPdv.graph.enduit['Prégy'].value + this.selectedPdv.graph.enduit['Salsi'].value + this.selectedPdv.potential).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' '),
      'typologie': this.selectedPdv.typologie,
    }
  }

  getPdvOnId(id: number): {[key:string]:any} {
    for(let pdv of this.rowData) {
      if(pdv.instanceId === id) return pdv;
    }
    return this.rowData[0];
  }

  displayInfobar(pdv: {[key:string]:any} | number) {
    if(typeof(pdv) === 'number') { let id = pdv; pdv = this.getPdvOnId(pdv); pdv.instanceId = id;}
    InfoBarComponent.valuesSave = JSON.parse(JSON.stringify(this.sliceTable.getPdvInstance(pdv)!.getValues())); //Values deepcopy
    InfoBarComponent.pdvId = pdv.instanceId;
    this.selectedPdv = pdv.instanceId;
    if(this.type === 'enduit') this.loadCustomData();
    this.pdv = PDV.getInstances().get(pdv.instanceId) // => displays infoBar
    this.cd.markForCheck();
  }
  // sideDivRight: string = "calc(-60% - 5px)";
  // showInfo: boolean = false;
  // infoData: any = {}
  // showInfoOnClick(data: any = {}) {
  //   this.logger.handleEvent(LoggerService.events.PDV_SELECTED, data.instanceId);
  //   this.logger.actionComplete();

  //   if(this.showInfo) {this.showInfo = false;    this.sideDivRight = "calc(-60% - 5px)";    return}
  //   this.showInfo = true
  //   this.sideDivRight = "0%";
  //   this.infoData = {
  //     'name': data.name,
  //     'enseigne': data.enseigne,
  //     'dep': data.dep,
  //     'typologie': data.typologie,
  //     'segmentMarketing': data.segmentMarketing,
  //     'segmentCommercial': data.segmentCommercial,
  //     'nbVisits': data.nbVisits,
  //     'siniatP2cdSales': Math.round(data.graph.p2cd['Siniat'].value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' '),
  //     'placoP2cdSales': Math.round(data.graph.p2cd['Placo'].value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' '),
  //     'knaufP2cdSales': Math.round(data.graph.p2cd['Knauf'].value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' '),
  //     'totalP2cdSales': Math.round(data.graph.p2cd['Siniat'].value + data.graph.p2cd['Placo'].value + data.graph.p2cd['Knauf'].value + data.graph.p2cd['Autres'].value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' '),
  //     'pregyEnduitSales': Math.round(data.graph.enduit['Pregy'].value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' '),
  //     'salsiEnduitSales': Math.round(data.graph.enduit['Salsi'].value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' '),
  //     'potential': Math.round(data.potential).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' '),
  //     'totalSiniatEnduitSales': Math.round(data.potential + data.graph.enduit['Salsi'].value + data.graph.enduit['Pregy'].value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' '),
  //     'totalEnduitSales': Math.round(data.graph.enduit['Pregy'].value + data.graph.enduit['Salsi'].value + data.potential).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' '),
  //   };
  // }

  changeRedistributed() {
    // this.sliceTable.updatePdv(this.selectedPdv, !this.redistributed);
    // this.updateGraph(this.updateData());
    
    this.redistributed= !this.redistributed; //doesn't update locally
    this.hasChanged = true;
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

  
  requestQuit() {
    console.log("click cover")
    //show the quit bar
    if ( this.hasChanged )
      this.quiting = true;
    else
      this.quit(false)
  }

  quit(save: boolean) {
    if(save && this.hasChanged) console.log("Updating pdv")
    else {
      console.log("not updating pdv")
    }
    this.hasChanged = false;
    this.quiting = false;
    // this.sideDivRight = "calc(-60% - 5px)";
    // this.showInfo = false;
  }


  ngOnDestroy() {
    super.ngOnDestroy();
  }
}

//for an unknown reason, only works if this variables are outside the class (next time, try them as public)
var hiddenGroups: {[field: string]: boolean} = {};
var groupInfos: {field: string, values: string[]} = {field : '', values: []};