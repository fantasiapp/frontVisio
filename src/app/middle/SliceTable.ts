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
                
                //!!!!!! hardcode for P2CDtable
                if(this.pdvFields[iter] === 'sales') {
                    newPdv['siniatSells'] = 0;
                    newPdv['totalSells'] = 0;
                    let siniatSells = 0;
                    let totalSells = 0;
                    for(let sale of pdv[iter]){
                        if(sale[0] === 1 || sale[0] === 2 || sale[0] === 3){ //check P2CD product id
                            if(sale[1] === 1 ) { //check Siniat industry id
                                siniatSells += sale[2]
                                newPdv['siniatSells'] += sale[2]
                            } else {
                                totalSells += sale[2]
                                newPdv['totalSells'] += sale[2]
                            }
                        }
                    }
                    this.titleData[1] = siniatSells;
                    this.titleData[2] = totalSells;
                } else {
                
                    if(this.columnData[this.pdvFields[iter]]) {
                        newPdv[this.pdvFields[iter]] = this.columnData[this.pdvFields[iter]][pdv[iter]]
                    } else {
                        newPdv[this.pdvFields[iter]] = pdv[iter];
                    }
                }
            }

            pdvsAsList.push(newPdv)
        }
        this.titleData[0] = Object.keys(this.pdvs).length;
        console.log("Ex : ", pdvsAsList[2])
        return pdvsAsList;
    }

    getColumnDefs(rowGroupId?: string): {}[]{ // !!! A bit hardcoded : specific to p2CDtable
        let visibleColumns = MOCK_DATA.getP2cdVisibleColumns();
        let allColumns = this.pdvFields.concat(MOCK_DATA.getP2cdSpecificColumns());
        let columnDefs: {[key:string]: any}[] = [];

        for(let field of allColumns) {
            let column = {field: field, hide: true, rowGroup: false}
            if(visibleColumns.includes(field)){
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

    getNavOpts() {
        return this.navigationOptions;
    }

    getTitleData() { // calculs are done in getPdvs, to browse only once the table
        return this.titleData;
    }

    getData(slice: any = {}, rowGroupId: string): {}[][]{
        let data: {}[][] = [];
        data.push(this.getColumnDefs(rowGroupId));
        data.push(this.getPdvs(slice));
        data.push(this.getNavOpts());
        data.push(this.getTitleData());
        return data;
    }

    getGroupsData(id: string) {
        return this.getColumnDefs(id);
    }
    
}