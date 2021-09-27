import { Component, ElementRef, OnInit } from '@angular/core';
import { FiltersStatesService } from 'src/app/filters/filters-states.service';
import { PDV, SliceDice } from 'src/app/middle/Slice&Dice';
import { SliceTable } from 'src/app/middle/SliceTable';
import { BasicWidget } from '../BasicWidget';

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

  //p2cd or enduit
  type: string = '';

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
      this.currentOpt = this.sliceTable.getNavIds(this.type)[0];
      this.updateGraph(this.updateData());
      })
  }
  gridObservable = new Observable();
  
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
    this.type = 'p2cd' //FIX IT ASAP
  }

  
  protected start(): void {
    this.gridObservable = new Observable((observer) => {
      observer.next()
    })
  }

  updateData(): any[] {
    return this.sliceTable.getData(this.path, this.currentOpt, this.type);
  }

  updateGraph(data: any[]): void {
    this.gridApi.setColumnDefs(data[0]);
    this.gridApi.setRowData(data[1]);
    this.navOpts = data[2];
    this.titleData = data[3];
  }

  updateGroups(id: string) {
    this.currentOpt = id;
    this.gridApi.setColumnDefs(this.sliceTable.getColumnDefs(this.type, id));
  }

  createGraph(data: any[], opt?: {}): void {
    throw new Error('Method not implemented.');
  }


}