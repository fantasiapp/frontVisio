import { DatePipe, formatDate } from "@angular/common";
import { Injectable, LOCALE_ID, Inject  } from "@angular/core";
import { DataService } from "../services/data.service";
import DataExtractionHelper from "./DataExtractionHelper";
import { PDV } from "./Slice&Dice";

@Injectable({
    providedIn: 'root'
  })
export class SliceTable {
    private pdvs: any[] = []; //Raw pdvs data, as list. Will be usefull to emit data updates to the back
    private sortedPdvsList: {}[] = [];
    private pdvsWithGroupslist: {}[] = [];
    groupInfos: {field: string, values: string[]} = {field : '', values: []};
    private titleData: number[] = [0,0,0];
    private pdvFields: string[];
    private segmentDnEnduit: {[id: number]: string} = {};
    private idsToFields: {[key: string]: {[key: number]: string}[]} = {};
    private columnDefs: {[k: string]: any}[] = [];

    private idIndustries: {[key: string]: number} = {};

    static currentGroupField: string = "enseigne";

    //type : 'p2cd' or 'enduit'
    private tableConfig : {[type: string]: {[property: string]: any}} = {
        'p2cd': {
            'computeTitle': () =>[
                this.sortedPdvsList.length,
                Math.floor(this.sortedPdvsList.reduce((totalSiniat: number, pdv: {}) => totalSiniat + (pdv as any).siniatSales,0)/1000),
                Math.floor(this.sortedPdvsList.reduce((totalSales: number, pdv: {}) => totalSales + (pdv as any).totalSales,0)/1000)
                ],
            'navIds': ['enseigne', 'clientProspect', 'segmentMarketing', 'segmentCommercial', 'ensemble'],
            'navNames': ['Enseigne', 'Client prosp.', 'Seg. Mark', 'Seg. Port.', 'Ensemble'],
            'visibleColumns': [{field: 'name', flex: 1}, {field: 'siniatSales', flex: 1}, {field: 'totalSales', flex: 1}, {field: 'edit', flex: 0.35}, {field: 'checkboxP2cd', flex: 0.35}, {field: 'pointFeu', flex: 0.35}],
            'specificColumns': ['clientProspect', 'siniatSales', 'totalSales', 'edit', 'checkboxP2cd', 'instanceId'],
            'customSort': (a: any, b: any) => {return b.totalSales - a.totalSales},
            'customGroupSort': (a: {}[], b: {}[]) => { return (<any>b[0]).totalSales - (<any>a[0]).totalSales },
            'groupRowConfig': (entry: any) => {
                let group: {}[] = [];
                group = group.concat({
                    'name': {'name': entry[0], 'number': entry[1].length},
                    'siniatSales': entry[1].reduce((totalSiniatSales: number, pdv: {}) => totalSiniatSales + (pdv as any).siniatSales, 0),
                    'totalSales': entry[1].reduce((totalTotalSales: number, pdv: {}) => totalTotalSales + (pdv as any).totalSales, 0),
                    'groupRow': true
                    })
                group = group.concat(entry[1]);
                return group;
            },
        },

        'enduit': {
            'computeTitle': () =>[
                this.sortedPdvsList.length,
                this.pdvsWithGroupslist.reduce((totalTarget: number, pdv: any) => totalTarget + (pdv.groupRow !== true && pdv.potential > 0  && pdv.checkboxEnduit === true ? pdv.potential : 0),0),
                Math.floor(this.sortedPdvsList.reduce((totalPotential: number, pdv: any) => totalPotential + (pdv.potential > 0 ? pdv.potential : 0),0)/1000)
                ],            'navIds': ['enseigne', 'typologie', 'segmentMarketing', 'ensemble'],
            'navNames': ['Enseigne', 'Typologie PdV', 'Seg. Mark.', 'Ensemble'],
            'visibleColumns': [{field: 'name', flex: 1},{field: 'nbVisits', flex: 0.4},{field: 'graph', flex: 1, valueGetter: (params: any) => { if (params.data.groupRow) { let value = 0; params.api.forEachNode( function(node: any) {if (node.data.checkboxEnduit && node.data[SliceTable.currentGroupField] === params.data.name.name && node.data.potential > 0) value+=node.data.potential}); return value; } else {return params.data.graph}}},{field: 'potential', flex: 0.4},{field: 'info', flex: 0.3},{field: 'checkboxEnduit', flex: 0.3}],
            'specificColumns': ['graph', 'potential', 'typologie', 'info', 'checkboxEnduit', 'instanceId'],
            'customSort': (a: any, b: any) => {return b.potential - a.potential},
            'customGroupSort': (a: {}[], b: {}[]) => { return (<any>b[0]).potential - (<any>a[0]).potential },
            'groupRowConfig': (entry: any) => {
                let group: {}[] = [];
                group = group.concat({
                    'name': {'name': entry[0], 'number': entry[1].length},
                    // 'target': 0,
                    'potential': entry[1].reduce((totalPotential: number, pdv: {}) => totalPotential + ((pdv as any).potential > 0 ? (pdv as any).potential : 0), 0),
                    'groupRow': true
                    })
                group = group.concat(entry[1]);
                return group;
            },
        }
    }

    private customField: {[name: string]: (pdv: any) => {}} = { //the way to compute them
        'siniatSales': (pdv: any) => {
            return pdv[DataExtractionHelper.SALES_ID].filter((sale: number[]) => ([1,2,3]
                .includes(sale[1]) && sale[2] === 1))
                .reduce((siniatSales: number, sale: number[]) => siniatSales + sale[3], 0);
        },
        'totalSales': (pdv: any) => {
            return pdv[DataExtractionHelper.SALES_ID].filter((sale: number[]) => ([1,2,3]
                .includes(sale[1])))
                .reduce((siniatSales: number, sale: number[]) => siniatSales + sale[3], 0);
        },
        'graph': (pdv: any) => {
            let p2cdSalesRaw: number[] = this.getPdvInstance(pdv)!.getValue('p2cd', true) as number[];
            let enduitSalesRaw: number[] = this.getPdvInstance(pdv)!.getValue('enduit', false, true) as number[];

            let p2cdSales: any =  {};
            let enduitSales: any =  {};
            p2cdSales['Siniat'] = {'value': p2cdSalesRaw[DataExtractionHelper.INDUSTRIE_SINIAT_ID], color: this.getColor('industry', 'Siniat')}
            p2cdSales['Placo'] = {'value': p2cdSalesRaw[DataExtractionHelper.INDUSTRIE_PLACO_ID], color: this.getColor('industry', 'Placo')}
            p2cdSales['Knauf'] = {'value': p2cdSalesRaw[DataExtractionHelper.INDUSTRIE_KNAUF_ID], color: this.getColor('industry', 'Knauf')}
            p2cdSales['Autres'] = {'value': p2cdSalesRaw
                                .filter((value, index) => {![DataExtractionHelper.INDUSTRIE_SINIAT_ID, DataExtractionHelper.INDUSTRIE_PLACO_ID, DataExtractionHelper.INDUSTRIE_KNAUF_ID].includes(index)})
                                .reduce((total: number, value: number) => total + value, 0)
                            ,color: this.getColor('industry', 'Challengers')}

            enduitSales['Pregy'] = {'value': enduitSalesRaw[0], color: this.getColor('indFinition', 'Pregy')}
            enduitSales['Salsi'] = {'value': enduitSalesRaw[1], color: this.getColor('indFinition', 'Salsi')}
            enduitSales['Autres'] = {'value': enduitSalesRaw[2]+enduitSalesRaw[3], color: this.getColor('indFinition', 'Croissance')}
            return {'p2cd': p2cdSales, 'enduit': enduitSales};
        },
        'potential': (pdv: any) => {
            let p2cdSalesRaw: number[] = this.getPdvInstance(pdv)!.getValue('p2cd', true) as number[];
            let siniatSale = p2cdSalesRaw[DataExtractionHelper.INDUSTRIE_SINIAT_ID];
            let totalSale = p2cdSalesRaw.filter((value, index) => {![DataExtractionHelper.INDUSTRIE_SINIAT_ID, DataExtractionHelper.INDUSTRIE_PLACO_ID, DataExtractionHelper.INDUSTRIE_KNAUF_ID].includes(index)})
            .reduce((total: number, value: number) => total + value, 0)

            let enduitSalesRaw: number[] = this.getPdvInstance(pdv)!.getValue('enduit', false, true) as number[];
            let pregySale = enduitSalesRaw[0];
            let salsiSale = enduitSalesRaw[0];


            return siniatSale > 0.1*totalSale ? (0.36*siniatSale) - salsiSale - pregySale : (0.36*totalSale) - salsiSale - pregySale;
        },
        'typologie': (pdv :any) => {
            let list = this.getPdvInstance(pdv)!.getValue('dn', false, true);
            if ((<number[]>list)[0] === 1) return this.segmentDnEnduit[1];
            else if ((<number[]>list)[1] === 1) return this.segmentDnEnduit[2];
            else return this.segmentDnEnduit[3];

        },
        'edit': () => {
            return true; //should return what is inside the new div ?
        },
        'checkboxEnduit': (pdv: any) => {
                return false;
        },
        'checkboxP2cd': (pdv: any) => {
            if(!pdv['target']) return false;
            return pdv['target'][DataExtractionHelper.TARGET_VOLUME_ID] > 0 && pdv['target'][DataExtractionHelper.TARGET_ID] !== 'r'
        },
        'clientProspect': (pdv: any) => {
            let array: any = this.getPdvInstance(pdv)!.getValue('dn', false, false, true);
            if(array[0] === 1) return DataExtractionHelper.get('clientProspect')[1]
            if(array[1] === 1) return DataExtractionHelper.get('clientProspect')[2]
            return DataExtractionHelper.get('clientProspect')[3]
        },
        'info': () => {
            return true;
        },
        'instanceId': (pdv: any) => pdv.instanceId,
    }

    constructor(private dataService: DataService, @Inject(LOCALE_ID) public locale: string){
        PDV.load(false);
        this.pdvFields = DataExtractionHelper.get('structurePdv');
        this.segmentDnEnduit = DataExtractionHelper.get('segmentDnEnduit')

        //Get idsToFields, to match id values in pdv to string values
        for(let field of this.pdvFields) {
            this.idsToFields[field] = DataExtractionHelper.get(field);
        }

                    // ⚠️⚠️⚠️ Début à 0 ? Ou à 1 ? ⚠️⚠️⚠️

        // this.idIndustries = {'Siniat': 0, 'Placo': 2, 'Knauf': 5}
        this.idIndustries = {'Siniat': DataExtractionHelper.INDUSTRIE_SINIAT_ID}

        console.log("Ids : ", this.idsToFields)
    }

    getPdvs(slice: any = {}, groupField: string, type: string): {[key:string]:any}[] { // Transforms pdv from lists to objects, and counts title informations
        let pdvs = []
        if (slice !== {}){
            let allPdvs = DataExtractionHelper.get('pdvs');
            for(let pdvInfo of PDV.sliceTree(slice)[0]) {
                let newPdv = allPdvs[pdvInfo.id];
                newPdv.instanceId = pdvInfo.id;
                pdvs.push(newPdv);
            }
        }
        this.pdvs = pdvs;
        let pdvsAsList =  [];
        for(let pdv of pdvs) {
            if(pdv[DataExtractionHelper.SALE_ID] === true) {
                var newPdv: {[key:string]:any} = {}; //concrete row of the table
                let allColumns = this.getAllColumns(type);
                for(let index = 0; index < Object.keys(allColumns).length; index ++) {
                    let field = allColumns[index]
                    if(this.idsToFields[field]) newPdv[field] = this.idsToFields[field][pdv[index]]
                    else if(this.tableConfig[type]['specificColumns'].includes(field)) newPdv[field] = this.customField[field](pdv);
                    else {
                        if(field==='pointFeu') console.log("Pb : ", pdv)
                        newPdv[field] = pdv[DataExtractionHelper.getKeyByValue(DataExtractionHelper.getPDVFields(), field)!]
                    }
                }
                pdvsAsList.push(newPdv);
            }
        }
        
        pdvsAsList.sort(this.tableConfig[type]['customSort'])
        this.sortedPdvsList = pdvsAsList;
        this.pdvsWithGroupslist = this.buildGroups(groupField, type);
        return this.pdvsWithGroupslist;
    }

    getAllColumns(type: string) {
        let allColumns = DataExtractionHelper.getPDVFields().concat(this.tableConfig[type]['specificColumns']);
        return allColumns;
    }

    getColumnDefs(type: string, rowGroupId?: string): {}[]{
        let allColumns = this.getAllColumns(type);
        let columnDefs: {[key:string]: any}[] = [];
        let visibleFields = this.tableConfig[type]['visibleColumns'].map((val: {'field': string}) => val.field);

        for(let field of allColumns) { //first all fields except visible
            if(!visibleFields.includes(field)) {
                let column = {'field': field, 'hide': true}
                columnDefs.push(column);
            }
        }
        for(let visibleColumn of this.tableConfig[type]['visibleColumns']) { //then visible, to ensure order
            let column : any = {'field': visibleColumn.field, 'flex': visibleColumn.flex, 'hide': false, 'colSpan': visibleColumn.colSpan ? visibleColumn.colSpan : (params: any) => 1}
            if(column.field === 'potential') column.colSpan = (params : any) => {return params.data.groupRow === true ? 3 : 1; };
            if(visibleColumn.valueGetter) column.valueGetter = visibleColumn.valueGetter; 
            columnDefs.push(column);
        }

        this.columnDefs = columnDefs;
        return this.columnDefs;
    }

    getNavIds(type: string): string[] {
        return this.tableConfig[type]['navIds'];
    }

    getNavOpts(type: string): {id: any, name: any}[] {
        let array: {id: any, name: any}[] = []
        let navIds = this.tableConfig[type]['navIds'];
        let navNames = this.tableConfig[type]['navNames'];
        for(let i=0; i<navIds.length; i++) array.push({id: navIds[i], name: navNames[i]})
        return array;
    }

    initializeTitleData(type: string){
        this.titleData = this.tableConfig[type]['computeTitle']();
    }

    getTitleData(){
        return this.titleData;
    }

    updateTotalTarget(increment: number) {
        this.titleData[1]+=increment;
    }


    getData(slice: any = {}, rowGroupId: string, type: string): {}[][]{
        let data: {}[][] = [];
        data.push(this.getColumnDefs(type, rowGroupId));
        data.push(this.getPdvs(slice, rowGroupId, type));
        data.push(this.getNavOpts(type));
        this.initializeTitleData(type);
        data.push([this.groupInfos])
        return data;
    }

    getGroupsData(type: string, id: string) {
        return this.getColumnDefs(type, id);
    }

    buildGroups(groupField: string, type: string) {
        SliceTable.currentGroupField = groupField;
        let pdvsByGroup = new Map<string, {}[]>();
        for(let pdv of this.sortedPdvsList){
            if(pdvsByGroup.get((pdv as any)[groupField]) === undefined) pdvsByGroup.set((pdv as any)[groupField], [pdv]);
            else pdvsByGroup.get((pdv as any)[groupField])!.push(pdv);
        }
        let groupList: {}[][] = [];
        for(let entry of pdvsByGroup.entries()) groupList.push(this.tableConfig[type]['groupRowConfig'](entry))
        groupList.sort(this.tableConfig[type]['customGroupSort']);
        this.groupInfos.field = groupField;
        this.groupInfos.values = Array.from(pdvsByGroup.keys());
        return groupList.flat()
    }

    getPdvInstance(pdv: any) {
        return PDV.getInstances().get(pdv.instanceId);
    }

    getColor(axis: string, enseigne: string): string {
        for(let array of Object.values(DataExtractionHelper.get('labelForGraph'))) {
            if ((array as any)[0] === axis && (array as any)[1] === enseigne) return (array as any)[2]
        }
        return 'black'
    }
  
    pdvFromObjectToList(pdv: any) { //operation inverse de la construction de row du tableau
        let pdvAsList = []
        for(let field of DataExtractionHelper.getPDVFields()) {
            if(this.idsToFields[field]) {
                for(let [id, fieldValue] of Object.entries(this.idsToFields[field])) {
                    if(fieldValue === pdv[field]) {
                        pdvAsList.push(id)
                        break;
                    }
                }
            } else pdvAsList.push(pdv[field])
        }
        return pdvAsList;
    }

    updatePdv(pdv: any, redistributed = false) { //We check here fields that may have been updated : target.redistributed, target.targetFinition
        let newPdv = this.pdvFromObjectToList(pdv);
        let newTarget;
        if(!pdv['target']) {
            newTarget = {
                0:formatDate(Date.now(), 'yyyy-MM-ddTHH:mm:ssZZZZZ', 'en-US'),
                1:redistributed,
                2:false,
                3:0,
                4:pdv['checkboxEnduit'],
                5:'g',
                6:""
            }
        } else {
            newTarget = pdv['target'];
            newTarget[DataExtractionHelper.TARGET_DATE_ID] = formatDate(Date.now(), 'yyyy-MM-ddTHH:mm:ssZZZZZ', this.locale);
            newTarget[DataExtractionHelper.TARGET_FINITION_ID] = pdv.checkboxEnduit;
            newTarget[DataExtractionHelper.TARGET_REDISTRIBUTED_ID] = redistributed;

        }

        newPdv[DataExtractionHelper.TARGET_ID] = newTarget;
        console.log("newPdv : ", newPdv)
        this.dataService.updatePdv(newPdv);
    }


    // updateData() {
    //     this.dataService.requestUpdateData()
    //     .subscribe((updatedData) => {
    //         DataExtractionHelper.updateData(updatedData as {[field: string]: []})
    //     })
    // }

}