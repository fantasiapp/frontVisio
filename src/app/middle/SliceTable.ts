import { Injectable } from "@angular/core";
import DataExtractionHelper from "./DataExtractionHelper";
import { PDV } from "./Slice&Dice";

@Injectable()
export class SliceTable {
    private pdvs: any;
    private pdvFields: string[];
    private idsToFields: {[key: string]: {[key: number]: string}[]} = {};
    private columnDefs: {[k: string]: any}[] = [];
    private navigationOptions: {id: any, name: any}[] = [];
    private titleData: number[] = [0,0,0];

    //type : 'p2cd' or 'enduit'
    private navIds: {[type: string]: string[]} = {
        'p2cd': ['enseigne', 'available', 'segmentMarketing', 'segmentCommercial', 'ensemble'],
        'enduit': []
    }
    private navNames: {[type: string]: string[]} = {
        'p2cd': ['Enseigne', 'Client prosp.', 'Seg. Mark', 'Seg. Port.', 'Ensemble'],
        'enduit': []
    }
    private visibleColumns: {[type: string]: string[]} = {
        'p2cd': ['name', 'siniatSales', 'totalSales'],
        'enduit':  []
    }
    private specificColumns: {[type: string]: string[]} = {
        'p2cd': ['siniatSales', 'totalSales'],
        'enduit':  []
    }

    private customField: {[name: string]: (pdv: any) => {}} = {
        'siniatSales': (pdv: any) => {
            return pdv[21].filter((sale: number[]) => ([1,2,3]
                .includes(sale[0]) && sale[1] === 1))
                .reduce((siniatSales: number, sale: number[]) => siniatSales + sale[2], 0);
        },
        'totalSales': (pdv: any) => {
            return pdv[21].filter((sale: number[]) => ([1,2,3]
                .includes(sale[0])))
                .reduce((siniatSales: number, sale: number[]) => siniatSales + sale[2], 0);
        },
    }

    
    constructor(){
        this.pdvs = DataExtractionHelper.get('pdvs')
        this.pdvFields = DataExtractionHelper.get('structurePdv');
    
        //Get idsToFields, to match id values in pdv to string values
        for(let field of this.pdvFields) {
            this.idsToFields[field] = DataExtractionHelper.get(field);
        }
    }

    getPdvs(slice: any = {}, type: string): {[key:string]:any}[] { // Transforms pdv from lists to objects, and counts title informations
        if (slice !== {}){
            this.pdvs = []
            let allPdvs = DataExtractionHelper.get('pdvs');
            let selectedPdvs = PDV.sliceTree(slice)[0]
            for(let pdvInfo of selectedPdvs) {
                this.pdvs.push(allPdvs[pdvInfo.id]);
            }
        }
        let pdvsAsList =  [];
        for(let pdv of this.pdvs) {
            var newPdv: {[key:string]:any} = {}; //concrete row of the table
            for(let index = 0; index < Object.keys(this.getAllColumns(type)).length; index ++) {
                let field = this.getAllColumns(type)[index]
                if(this.idsToFields[field]) {
                    newPdv[field] = this.idsToFields[field][pdv[index]]
                } else if(this.specificColumns[type].includes(field)) {
                    newPdv[field] = this.customField[field](pdv);
                } else {
                    newPdv[field] = pdv[index]
                }
            }
            pdvsAsList.push(newPdv);
        }
        this.titleData[0] = Object.keys(this.pdvs).length;
        return pdvsAsList;
    }

    getAllColumns(type: string) {
        let visibleColumns = this.visibleColumns[type];
        let allColumns = this.pdvFields.concat(this.specificColumns[type]);
        return allColumns;
    }

    getColumnDefs(type: string, rowGroupId?: string): {}[]{ // !!! A bit hardcoded : specific to p2CDtable
        let allColumns = this.getAllColumns(type);
        let columnDefs: {[key:string]: any}[] = [];

        for(let field of allColumns) {
            let column = {field: field, hide: true, rowGroup: false}
            if(this.visibleColumns[type].includes(field)){
                column.hide = false;
            }
            if(field === rowGroupId) {
                column.rowGroup = true;
            }
            columnDefs.push(column);
        }

        this.columnDefs = columnDefs;
        return this.columnDefs;
    }

    getNavIds(type: string): string[] {
        return this.navIds[type];
    }

    getNavOpts(type: string): {id: any, name: any}[] {
        let array: {id: any, name: any}[] = []
        let navIds = this.navIds[type];
        let navNames = this.navNames[type];
        for(let i=0; i<navIds.length; i++) {
            array.push({id: navIds[i], name: navNames[i]})
        }
        return array;
    }

    getTitleData() { // calculs are done in getPdvs, to browse only once the table
        return this.titleData;
    }

    getData(slice: any = {}, rowGroupId: string, type: string): {}[][]{
        let data: {}[][] = [];
        data.push(this.getColumnDefs(type, rowGroupId));
        data.push(this.getPdvs(slice, type));
        data.push(this.getNavOpts(type));
        data.push(this.getTitleData());
        return data;
    }

    getGroupsData(type: string, id: string) {
        return this.getColumnDefs(type, id);
    }
    
}