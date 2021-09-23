import { Injectable } from "@angular/core";
import DataExtractionHelper from "./DataExtractionHelper";
import { MOCK_DATA } from "../widgets/table/MOCK";

@Injectable()
export class SliceTable {
    private pdvs: any;
    private pdvFields: string[];
    private columnDefs: {[k: string]: any}[] = [];
    private navigationOptions: {id: any, name: any}[] = [];

    constructor(){
        this.pdvs = DataExtractionHelper.get('pdvs')
        this.pdvFields = DataExtractionHelper.getPDVFields();
        this.navigationOptions = MOCK_DATA.getNavOpts();
    }

    getPdvs(slice: any = {}): {[key:string]:any}[] {
        let pdvsAsList =  [];
        for (let key of Object.keys(this.pdvs)) {
            var pdv: {[key:string]:any} = {};
            for( let iter = 0; iter < this.pdvFields.length; iter++) {
                pdv[this.pdvFields[iter]] = this.pdvs[key][iter]; 
            }
            pdvsAsList.push(pdv)
        }
        return pdvsAsList;
    }

    getColumnDefs(): {}[]{
        let columnDefs: {}[] = [];
        let visibleColumns = MOCK_DATA.getVisibleColumns();

        for (let field of this.pdvFields) {
            let column = {field: '', hide: true};
            column.field = field;
            if(visibleColumns.includes(field)){
                column.hide = false;
            }
            columnDefs.push(column);
        }
        this.columnDefs = columnDefs;
        return this.columnDefs;
    }

    getNavOpts() {
        return this.navigationOptions;
    }

    getData(slice: any = {}): {}[][]{
        // let data: {
        //     columnDefs: {}[];
        //     rowData: {[key:string]:any}[];
        // } = {columnDefs: [], rowData: []};
        // data.rowData = this.getPdvs();
        let data: {}[][] = [];
        data.push(this.getColumnDefs());
        data.push(this.getPdvs());
        data.push(this.getNavOpts());
        return data;
    }

    getGroupsData() {
        
    }
    
}