import { Injectable } from "@angular/core";
import DataExtractionHelper from "./DataExtractionHelper";
import { MOCK_DATA } from "../widgets/table/MOCK";
import { PDV } from "./Slice&Dice";

@Injectable()
export class SliceTable {
    private pdvs: any;
    private pdvFields: string[];
    private columnData: {[key: string]: {[key: number]: string}[]} = {};
    private columnDefs: {[k: string]: any}[] = [];
    private navigationIds;
    private navigationOptions: {id: any, name: any}[] = [];
    private titleData: number[] = [0,0,0];

    constructor(){
        this.pdvs = DataExtractionHelper.get('pdvs')
        this.pdvFields = DataExtractionHelper.get('structurePdv');
        this.navigationIds = MOCK_DATA.getNavIds();
        this.navigationOptions = MOCK_DATA.getNavOpts();
    
        //Get columnData, to match id values in pdv to string values
        for(let field of this.pdvFields) {
            this.columnData[field] = DataExtractionHelper.get(field);
        }
    }

    getPdvs(slice: any = {}): {[key:string]:any}[] { // Transforms pdv from lists to objects, and counts title informations
        if (slice !== {}){
            this.pdvs = []
            let allPdvs = DataExtractionHelper.get('pdvs');
            let selectedPdvs = PDV.sliceTree(slice)[0]
            for(let pdvInfo of selectedPdvs) {
                this.pdvs.push(allPdvs[pdvInfo.id]);
            }
        }
        let pdvsAsList =  [];
        for (let pdv of this.pdvs){
            var newPdv: {[key:string]:any} = {};
            for(let iter = 0; iter < this.pdvFields.length; iter ++){
                if(this.columnData[this.pdvFields[iter]]) {
                    newPdv[this.pdvFields[iter]] = this.columnData[this.pdvFields[iter]][pdv[iter]]
                } else {
                    newPdv[this.pdvFields[iter]] = pdv[iter];
                }
            }

            pdvsAsList.push(newPdv)
        }
        console.log(pdvsAsList[0])
        return pdvsAsList;
    }

    getColumnDefs(): {}[]{
        let columnDefs: {[key:string]: any}[] = [];
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
        this.titleData[2] = 6316;
        return this.titleData;
    }

    getData(slice: any = {}): {}[][]{
        let data: {}[][] = [];
        data.push(this.getColumnDefs());
        data.push(this.getPdvs(slice));
        data.push(this.getNavOpts());
        data.push(this.getTitleData());
        return data;
    }

    getGroupsData(id: string) {
        let newColumnDefs = []
        for(let colDef of this.columnDefs) {
            if(this.navigationIds.includes(colDef.field)) {
                colDef.rowGroup = false;
            }
            if(colDef.field === id) {
                colDef.rowGroup = true;
            }
            newColumnDefs.push(colDef);
        }
        this.columnDefs = newColumnDefs;
        return newColumnDefs;
    }
    
}