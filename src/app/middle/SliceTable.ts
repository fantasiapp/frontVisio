import { Injectable } from "@angular/core";
import DataExtractionHelper from "./DataExtractionHelper";
import { PDV } from "./Slice&Dice";

@Injectable()
export class SliceTable {
    private pdvs: any;
    private sortedPdvsList: {}[] = [];
    private pdvFields: string[];
    private segmentDnEnduit: {[id: number]: string} = {};
    private idsToFields: {[key: string]: {[key: number]: string}[]} = {};
    private columnDefs: {[k: string]: any}[] = [];
    private navigationOptions: {id: any, name: any}[] = [];
    private titleData: number[] = [0,0,0];

    //type : 'p2cd' or 'enduit'
    private navIds: {[type: string]: string[]} = {
        'p2cd': ['enseigne', 'available', 'segmentMarketing', 'segmentCommercial', 'ensemble'],
        'enduit': ['enseigne', 'typologie', 'segmentMarketing', 'ensemble']
    }
    private navNames: {[type: string]: string[]} = {
        'p2cd': ['Enseigne', 'Client prosp.', 'Seg. Mark', 'Seg. Port.', 'Ensemble'],
        'enduit': ['Enseigne', 'Typologie PdV', 'Seg. Mark.', 'Ensemble']
    }
    private visibleColumns: {[type: string]: {field: string, flex: number}[]} = {
        'p2cd': [{field: 'name', flex: 1}, {field: 'siniatSales', flex: 1}, {field: 'totalSales', flex: 1}, {field: 'edit', flex: 0.35}, {field: 'checkbox', flex: 0.35}, {field: 'pointFeu', flex: 0.35}],
        'enduit': [{field: 'name', flex: 1},{field: 'visits', flex: 1},{field: 'target', flex: 1},{field: 'potential', flex: 1}]
    }
    private specificColumns: {[type: string]: string[]} = { //newly calculated columns
        'p2cd': ['siniatSales', 'totalSales', 'edit', 'checkbox'],
        'enduit':  ['visits', 'target', 'potential', 'typologie']
    }

    private customField: {[name: string]: (pdv: any) => {}} = { //the way to compute them
        'siniatSales': (pdv: any) => {
            return pdv[21].filter((sale: number[]) => ([1,2,3]
                .includes(sale[1]) && sale[0] === 1))
                .reduce((siniatSales: number, sale: number[]) => siniatSales + sale[2], 0);
        },
        'totalSales': (pdv: any) => {
            return pdv[21].filter((sale: number[]) => ([1,2,3]
                .includes(sale[1])))
                .reduce((siniatSales: number, sale: number[]) => siniatSales + sale[2], 0);
        },
        'visits': (pdv: any) => {
            return 1;
        },
        'target': (pdv: any) => {
            return [1,2,3];
        },
        'potential': (pdv: any) => {
            return 1;
        },
        'typologie': (pdv :any) => {
            let list = PDV.getInstances().get(pdv[0])!.getValue('dn', false, true);
            if ((<number[]>list)[0] === 1) return this.segmentDnEnduit[1];
            else if ((<number[]>list)[1] === 1) return this.segmentDnEnduit[2];
            else return this.segmentDnEnduit[3];

        },
        'edit': () => {
            return true; //should return what is inside the new div ?
        },
        'checkbox': () => {
            return false; //Could be check by default ?
        }
    }
    
    private customSort: {[name: string]: (a: any, b: any) => number} = {
        'p2cd': (a: any, b: any) => {return b.totalSales - a.totalSales},
        'enduit': (a: any, b: any) => {return 1},
    }


    constructor(){
        PDV.load(false);
        this.pdvs = DataExtractionHelper.get('pdvs')
        this.pdvFields = DataExtractionHelper.get('structurePdv');
        this.segmentDnEnduit = DataExtractionHelper.get('segmentDnEnduit')

        //Get idsToFields, to match id values in pdv to string values
        for(let field of this.pdvFields) {
            this.idsToFields[field] = DataExtractionHelper.get(field);
        }

    }

    getPdvs(slice: any = {}, groupField: string, type: string): {[key:string]:any}[] { // Transforms pdv from lists to objects, and counts title informations
        if (slice !== {}){
            this.pdvs = []
            let allPdvs = DataExtractionHelper.get('pdvs');
            for(let pdvInfo of PDV.sliceTree(slice)[0]) {
                let newPdv = allPdvs[pdvInfo.id];
                newPdv[0] = pdvInfo.id; //rewriting pdv code (as we never use it)
                this.pdvs.push(newPdv);
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
        console.log("Pdvs : ", pdvsAsList)
        
        this.titleData[0] = Object.keys(this.pdvs).length;
        pdvsAsList.sort(this.customSort[type])
        this.sortedPdvsList = pdvsAsList;
        // this.buildGroups('enseigne')
        return this.buildGroups(groupField)
;
    }

    getAllColumns(type: string) {
        let allColumns = this.pdvFields.concat(this.specificColumns[type]);
        return allColumns;
    }

    getColumnDefs(type: string, rowGroupId?: string): {}[]{
        let allColumns = this.getAllColumns(type);
        let columnDefs: {[key:string]: any}[] = [];
        let visibleFields = this.visibleColumns[type].map(({field}) => field);

        for(let field of allColumns) { //first all fields except visible
            if(!visibleFields.includes(field)) {
                let column = {'field': field, 'hide': true, 'rowGroup': false}
                columnDefs.push(column);
            }
        }
        for(let visibleColumn of this.visibleColumns[type]) { //then visible, to ensure order
            let column = {'field': visibleColumn.field, 'flex': visibleColumn.flex, 'hide': false, 'rowGroup': false}
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
        data.push(this.getPdvs(slice, rowGroupId, type));
        data.push(this.getNavOpts(type));
        data.push(this.getTitleData());
        return data;
    }

    getGroupsData(type: string, id: string) {
        return this.getColumnDefs(type, id);
    }

    buildGroups(groupField: string) {
        let pdvsByGroup = new Map<string, {}[]>();
        for(let pdv of this.sortedPdvsList){
            if(pdvsByGroup.get((pdv as any)[groupField]) === undefined) {
                pdvsByGroup.set((pdv as any)[groupField], [pdv]);
            } else {
                pdvsByGroup.get((pdv as any)[groupField])!.push(pdv);
            }
        }
        let groupList: {}[][] = [];
        for(let entry of pdvsByGroup.entries()){
            let group: {}[] = [];
            /*** P2CD hard-coded ***/
            group = group.concat({
                'name': entry[0],
                'siniatSales': entry[1].reduce((totalSiniatSales: number, pdv: {}) => totalSiniatSales + (pdv as any).siniatSales, 0),
                'totalSales': entry[1].reduce((totalTotalSales: number, pdv: {}) => totalTotalSales + (pdv as any).totalSales, 0),
                'groupRow': true
                })

                group = group.concat(entry[1]);
                groupList.push(group)
        }
        groupList.sort((a: {}[], b: {}[]) => { return (<any>b[0]).totalSales - (<any>a[0]).totalSales });
        return groupList.flat()
    }
}