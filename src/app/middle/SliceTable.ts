import { Injectable } from "@angular/core";
import DataExtractionHelper from "./DataExtractionHelper";
import { MOCK_DATA } from "../widgets/table/MOCK";

@Injectable()
export class SliceTable {
    private pdvs: any;
    private pdvFields: string[];
    private columnDefs: {[k: string]: any}[] = [];
    private navigationOptions: {id: any, name: any}[] = [];
    private enseigne: {[key: number]: string} = {};
    private segmentMarketing: {[key: number]: string} = {};
    private titleData: number[] = [0,0,0];

    constructor(){
        this.pdvs = DataExtractionHelper.get('pdvs')
        this.pdvFields = DataExtractionHelper.getPDVFields();
        this.navigationOptions = MOCK_DATA.getNavOpts();
        this.enseigne = DataExtractionHelper.get('enseigne')
        this.segmentMarketing = DataExtractionHelper.get('segmentMarketing')
    }

    getPdvs(slice: any = {}): {[key:string]:any}[] { // Transforms pdv from lists to objects, and counts title informations
        let pdvsAsList =  [];
        for (let key of Object.keys(this.pdvs)) {
            var pdv: {[key:string]:any} = {};
            for( let iter = 0; iter < this.pdvFields.length; iter++) {
                if(this.pdvFields[iter] === 'enseigne') {
                    pdv['enseigne'] = this.enseigne[this.pdvs[key][iter]];
                } else if(this.pdvFields[iter] === 'segmentMarketing') {
                    pdv['segmentMarketing'] = this.segmentMarketing[this.pdvs[key][iter]];
                } else {
                    pdv[this.pdvFields[iter]] = this.pdvs[key][iter]; 
                }
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

    getTitleData() { // calculs are done in getPdvs, to browse only once the table
        this.titleData[0] = Object.keys(this.pdvs).length;
        this.titleData[1] = 2006;
        this.titleData[3] = 6316;
        return this.titleData;
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
        data.push(this.getTitleData());
        return data;
    }

    getGroupsData() {

    }
    
}