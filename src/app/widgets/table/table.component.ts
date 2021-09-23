import { Component, ElementRef, OnInit } from '@angular/core';
import { FiltersStatesService } from 'src/app/filters/filters-states.service';
import { SliceDice } from 'src/app/middle/Slice&Dice';
import { SliceTable } from 'src/app/middle/SliceTable';
import { BasicWidget } from '../BasicWidget';

import { MOCK_DATA } from './MOCK';
import 'ag-grid-enterprise';

@Component({
  selector: 'app-table',
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.css'],
  providers: [SliceDice],
})
export class TableComponent extends BasicWidget {

  private content!: ElementRef;
  
  //Navigation menu
  navOpts: any;
  
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
    console.log("Ready once")
    this.gridApi = params.api;
    this.columnApi = params.columnApi;
  }
  
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
  }

  //@override
  updateData(): any[] {
    let args: any[] = this.properties.arguments;
    return this.sliceTable.getData();
  }

  createGraph(data: any[]): void { //abstract in BasicWidgets
    this.columnDefs = data[0];
    this.rowData = data[1];
    this.navOpts = data[2];
  }

  updateGraph(data: any[]): void {
    return this.noData(this.content);
  }

  updateGroups(id: string) {
    var columnDefs = this.gridApi.getColumnDefs();
    let navIds = MOCK_DATA.getNavIds();

    columnDefs.forEach((colDef: any) => {
      if(navIds.includes(colDef.field)) {
        colDef.rowGroup = false;
      }
      if(colDef.field === id) {
        colDef.rowGroup = true;
      }

    })
    this.columnDefs = columnDefs;
  }

}


