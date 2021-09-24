import { Component, ElementRef, OnInit } from '@angular/core';
import { FiltersStatesService } from 'src/app/filters/filters-states.service';
import { PDV, SliceDice } from 'src/app/middle/Slice&Dice';
import { SliceTable } from 'src/app/middle/SliceTable';
import { BasicWidget } from '../BasicWidget';

import { MOCK_DATA } from './MOCK';
import 'ag-grid-enterprise';
import { ICellRendererParams } from 'ag-grid-community';
import { Observable, of } from 'rxjs';

@Component({
  selector: 'app-table',
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.css'],
  providers: [SliceDice],
})
export class TableComponent extends BasicWidget {

  private content!: ElementRef;
  titleData: number[] = [0,0,0];

  //Navigation menu
  navOpts: any;
  currentOpt: any;

  //Columns
  defaultColDef: any;
  columnDefs: any;

  //Rows
  rowData: any;

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
      this.updateGraph(this.updateData());
      })
  }
  gridObservable = new Observable();
  gridObserver = {next: ()=>{}};
  gridReady = false;

  
  constructor(protected ref: ElementRef, protected filtersService: FiltersStatesService, protected sliceDice: SliceDice, protected sliceTable: SliceTable) {
    super(ref, filtersService, sliceDice);
    this.defaultColDef = {
      flex: 1,
      editable: false,
      resizable: false,
      suppressMovable: true,
    };
    this.groupDisplayType = 'groupRows';
    this.groupDefaultExpanded = -1;
    this.currentOpt = 'enseigne';
  }

  
  protected start(): void {
    this.gridObservable = new Observable((observer) => {
      observer.next()
    })
  }

  updateData(): any[] {
    let args: any[] = this.properties.arguments;
    return this.sliceTable.getData(this.path);
  }

  createGraph(data: any[]): void { //abstract in BasicWidgets
    this.columnDefs = data[0];
    this.rowData = data[1];
    this.navOpts = data[2];
    this.titleData = data[3];
  }

  updateGraph(data: any[]): void {
    this.gridApi.setColumnDefs(data[0]);
    this.gridApi.setRowData(data[1]);
    this.navOpts = data[2];
    this.titleData = data[3];
    this.updateGroups(this.currentOpt);
  }

  updateGroups(id: string) {
    this.currentOpt = id;
    this.columnDefs = this.sliceTable.getGroupsData(id);
  }

}