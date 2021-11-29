import { Component, ElementRef, ViewChild, Injector } from '@angular/core';
import { PDV } from 'src/app/middle/Pdv';
import { SliceTable, TableData, TableTypes } from 'src/app/middle/SliceTable';
import { BasicWidget } from '../BasicWidget';

import { AsyncSubject } from 'rxjs';
import { EditCellRenderer, CheckboxP2cdCellRenderer, CheckboxEnduitCellRenderer, PointFeuCellRenderer, NoCellRenderer, TargetCellRenderer, InfoCellRenderer, AddArrowCellRenderer } from './renderers';
import DEH from 'src/app/middle/DataExtractionHelper';
import { Utils } from 'src/app/interfaces/Common';
import { DataService } from 'src/app/services/data.service';

@Component({
  selector: 'app-table',
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.css'],
})
export class TableComponent extends BasicWidget {

  @ViewChild('title', {static: false, read: ElementRef})
  private titleContainer?: ElementRef;
  
                      /**************/
                      /*  Variables */
                      /**************/

  /** Can be 'p2cd' or 'enduit' **/
  type: TableTypes = TableTypes.p2cd;
  /** Navigation menu **/
  navOpts: any;
  currentOpt: any;
  /** Dynamic grid properties **/
  gridOptions: any;
  columnDefs: any;
  rowData: PDV[] = [];
  /** Side-bar input **/
  pdv?: PDV;
  /** Graph description **/
  showDescription: boolean = false;
  description: any[] = []
  mouseX: number = 0; mouseY: number = 0;
  /** Observables **/
  gridLoaded = new AsyncSubject<null>();


  constructor(protected injector: Injector, protected sliceTable: SliceTable, private dataService: DataService) {
    super(injector);
    
    /** Static properties of the ag-grid component **/
    this.gridOptions = {
      rowHeight:                    45
      ,
      headerHeight:                 0
      ,
      animateRows:                  true
      ,
      defaultColDef: {          //Mostly used here to restrict the ag-grid behaviours
                                    flex: 1,
                                    editable: false,
                                    resizable: false,
                                    suppressMovable: true,
      },
      rowClassRules: {          //Allow to define dynamically classes to grid rows
                                    'group-row': 'data.groupRow === true',
                                    'pdv-displayed-orange': (params: any) =>  {
                                      if(params.data['groupRow'] || this.type == 'enduit') return false;
                                      if(this.sliceTable.getRowColor(params.data) == 'orange') return true;
                                      return false;
                                    },
                                    'pdv-displayed-red': (params: any) =>  {
                                      if(params.data['groupRow'] || this.type == 'enduit') return false;
                                      if(this.sliceTable.getRowColor(params.data) == 'red') return true;
                                      return false;
                                    }
      },
      frameworkComponents: {    //Here are listed the renderers defined in renderer.ts used for custom cell render
                                    editCellRenderer: EditCellRenderer,
                                    checkboxP2cdCellRenderer: CheckboxP2cdCellRenderer,
                                    checkboxEnduitCellRenderer: CheckboxEnduitCellRenderer,
                                    pointFeuCellRenderer: PointFeuCellRenderer,
                                    noCellRenderer: NoCellRenderer,
                                    targetCellRenderer: TargetCellRenderer,
                                    infoCellRenderer: InfoCellRenderer,
                                    addArrowCellRenderer: AddArrowCellRenderer,
      },
      isExternalFilterPresent:   
                                    () => Object.keys(hiddenGroups).length > 0
      ,
      doesExternalFilterPass:   //Called by the grid api on every row when the filter are changed   
                                    (node: any) => {
                                      if(node.data.groupRow == true) return true;
                                      return !hiddenGroups[node.data[groupInfos.field]] === true;
                                    }
    }
  }

                      /*****************************************/
                      /*  Inherited Methods (from BasicWidget) */
                      /*****************************************/
  
  /** Useless in this Widget **/
  start(): void {}

  /** Called when next is called on the DataService update Subject **/
  refresh() {
    this.gridOptions.api.redrawRows()
    this.renderTitle()
  }

  /** Called when browsing the navigation **/
  update() {
    if(this.dataService.onlyRefresh) this.refresh();
    else {
      this.rowData = this.sliceTable.getPdvs(this.type)
      this.renderTitle()
    }
  }

  createGraph(data: TableData): void {
    this.currentOpt = 'name';
    this.columnDefs = this.setupCellRenderers(data.columnDefs);
    this.navOpts = data.navOpts;
    groupInfos = data.colInfos;
    hiddenGroups = {}
    this.rowData = data.pdvs
    this.renderTitle()
  }

  createData(): TableData {
    this.type = this.properties.arguments[2];
    SliceTable.currentGroupField = this.currentOpt;
    return this.sliceTable.getData(this.type);
  }

                      /******************/
                      /*  Local methods */
                      /******************/

  /** Called by the navigation radio buttons **/
  updateGroups(id: string) {
    this.currentOpt = id;
    SliceTable.currentGroupField = this.currentOpt;
    this.gridOptions.api.setRowData(this.sliceTable.buildGroups(this.type))
    groupInfos = this.sliceTable.groupInfos;
    hiddenGroups = {}
  }

  /** Called whenever the title should be updated */ 
  private renderTitle() {
    let titleData = this.sliceTable.computeTitle(this.type);
    if(this.type === 'p2cd') this.titleContainer!.nativeElement.innerText = `PdV: ${Utils.format(titleData[0])}, Siniat : ${Utils.format(titleData[1]/1000)}, sur un total identifié de ${Utils.format(titleData[2]/1000)} en Km²`;
    if(this.type === 'enduit') this.titleContainer!.nativeElement.innerText = `PdV: ${Utils.format(titleData[0])}, ciblé : ${Utils.format(titleData[1]/1000, 3, true)} Tonnes, sur un potentiel de ${Utils.format(titleData[2]/1000)} en Tonnes`
  }

  /** Sets the necessary cellRenderer / valueFormatter for the grid columns */
  private setupCellRenderers(columnDefs: any[]): any[] {
        for(let cd of columnDefs){
          switch (cd.field) {
            case 'name':
              cd.valueFormatter = function (params: any) {
                if(params.data.groupRow === true) {
                  if(SliceTable.currentGroupField == 'typology') return DEH.getFilter('segmentDnEnduit')[params.value['name']] + ' PdV : ' + params.value['number'];
                  return DEH.getFilter(SliceTable.currentGroupField)[params.value['name']] + ' PdV : ' + params.value['number'];
                }
                return;
              }
              break;

            case 'siniatSales':
              cd.valueFormatter = function (params: any) {
                if(params.data.groupRow === true) return 'Siniat : ' + Utils.format(params.value/1000, 3, true) + " km²";
                return Utils.format(params.value, 3, true)  + " m²";
              }
              break;

            case 'totalSales':
              cd.valueFormatter = function (params: any) {
                if(params.data.groupRow === true) return 'Identifie : ' + Utils.format(params.value/1000, 3, true) + " km²";
                else return Utils.format(params.value, 3, true)  + " m²";
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
                if(params.data.groupRow ===  true) return "Cible : " + Utils.format(params.value/1000, 3, true) + " T"
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
                if(params.data.groupRow === true) return 'Sur un potentiel de: ' + Utils.format(params.value/1000, 3, true) + ' T'
                return Utils.format(params.value/1000, 3, true) + ' T'
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

  computeDescription(graphValue: {[type in TableTypes]: any[]}) {
    return [
      Object.entries(graphValue[TableTypes.p2cd]).map(
        (entry: any) => [
          entry[0],
          {value: entry[1].value = Utils.format(entry[1].value, 3, true), color: entry[1].color}
        ]
      ),
      Object.entries(graphValue[TableTypes.enduit]).map(
        (entry: any) => [
          entry[0],
          {value: entry[1].value = Utils.format(entry[1].value, 3, true), color: entry[1].color}
        ]
      )
    ]
  }

  displayInfobar(pdv: PDV | number) {
    if(typeof(pdv) === 'number') { pdv = PDV.findById(pdv)!;}
    this.pdv = PDV.findById(pdv.id) // => displays infoBar
    this.cd.markForCheck();
  }

  protected onClick(e: PointerEvent) {
    //do nothing
  }

  /** Bound with (mousemove) on the whol agGrid component **/
  getMousePosition() { 
    let e = window.event as any;
    this.mouseX = e.pageX;
    this.mouseY = e.pageY;
  }

  /** Manages custom group feature **/
  externalFilterChanged(value: any) {
    if (hiddenGroups[value] === true) delete hiddenGroups[value];
    else hiddenGroups[value] = true;
    this.gridOptions.api.onFilterChanged();
  }

                      /*******************************/
                      /*  Ag-Grid data bound methods */
                      /*******************************/

  onGridReady(params: any) { //Grid initializations
    this.currentOpt = this.sliceTable.getNavIds(this.type)[0];
    this.createGraph(this.createData());
    this.gridLoaded.next(null);
    this.gridLoaded.complete();
  }
  onCellClicked(event: any) { //
    console.log("Data : ", event['data'], event)
    if(event['data'].groupRow === true) { //Defines custom group feature
      this.externalFilterChanged(event['data'].name.name)
      let arrowImg = document.getElementById(event['node'].data.name.name);
      if(arrowImg?.style.transform == "rotate(-0.5turn)") arrowImg!.style.transform = "rotate(0turn)";
      else arrowImg!.style.transform = "rotate(-0.5turn)"
    } else {
      if(event['column']['colId'] === 'edit' || event['column']['colId'] === 'info') this.displayInfobar(event['data'])
    }
  }
  onCellMouseOver(event: any) {
    if(event['column']['colId'] === 'graph' && event['data'].groupRow !== true) {
      this.showDescription = true;
      this.description = this.computeDescription(JSON.parse(JSON.stringify(event.value))) // JSON.parse(JSON.stringify(object)) performs a deepcopy
    }
  }
  onCellMouseOut(event: any) {
    if(event['column']['colId'] === 'graph' && event['data'].groupRow !== true) {
      this.showDescription = false;
    }
  }

}

//for an unknown reason, only works if this variables are outside the class (next time, try them as public)
var hiddenGroups: {[field: string]: boolean} = {};
var groupInfos: {field: string, values: string[]} = {field : '', values: []};