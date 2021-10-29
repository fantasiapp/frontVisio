import { Injectable, LOCALE_ID, Inject  } from "@angular/core";
import { DataService } from "../services/data.service";
import DEH from "./DataExtractionHelper";
import { PDV, SliceDice } from "./Slice&Dice";

@Injectable({
    providedIn: 'root'
  })
export class SliceTable {
    private sortedPdvsList: {}[] = [];
    private pdvsWithGroupslist: {}[] = [];
    groupInfos: {field: string, values: string[]} = {field : '', values: []};
    private titleData: number[] = [0,0,0];
    private pdvFields: string[];
    private segmentDnEnduit: {[id: number]: string} = {};
    private idsToFields: {[key: string]: {[key: number]: string}[]} = {};
    private columnDefs: {[k: string]: any}[] = [];

    private idIndustries: {[key: string]: number} = {};
    private geoTree : boolean = true;

    static currentGroupField: string = "enseigne";

    //type : 'p2cd' or 'enduit'
    private tableConfig : {[type: string]: {[property: string]: any}} = {
        'p2cd': {
            'computeTitle': () =>[
                this.sortedPdvsList.length,
                this.sortedPdvsList.reduce((totalSiniat: number, pdv: {}) => totalSiniat + (pdv as any).siniatSales,0),
                this.sortedPdvsList.reduce((totalSales: number, pdv: {}) => totalSales + (pdv as any).totalSales,0)
                ],
            'navIds': () => this.geoTree ? ['enseigne', 'clientProspectProperty', 'segmentMarketing', 'segmentCommercial', 'ensemble'] : ['clientProspectProperty', 'segmentMarketing', 'segmentCommercial', 'ensemble'],
            'navNames': () => this.geoTree ? ['Enseigne', 'Client prosp.', 'Seg. Mark', 'Seg. Port.', 'Ensemble'] : ['Client prosp.', 'Seg. Mark', 'Seg. Port.', 'Ensemble'],
            'visibleColumns': [{field: 'name', flex: 1}, {field: 'siniatSales', flex: 1}, {field: 'totalSales', flex: 1}, {field: 'edit', flex: 0.35}, {field: 'checkboxP2cd', flex: 0.35, valueGetter: (params : any) => {if (params.data.groupRow) return false; else { if (!params.data.target) return false; else return params.data.target[5] !== 'r'}}}, {field: 'pointFeu', flex: 0.35}],
            'specificColumns': ['clientProspectProperty', 'siniatSales', 'totalSales', 'edit', 'checkboxP2cd', 'id'],
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
            'updatableColumns': ['totalSales', 'checkboxP2cd'],
        },

        'enduit': {
            'computeTitle': () =>[
                this.sortedPdvsList.length,
                this.pdvsWithGroupslist.reduce((totalTarget: number, pdv: any) => totalTarget + (pdv.groupRow !== true && pdv.potential > 0  && pdv.targetFinition === true ? pdv.potential : 0),0),
                this.sortedPdvsList.reduce((totalPotential: number, pdv: any) => totalPotential + (pdv.potential > 0 ? pdv.potential : 0),0)
                ],
            'navIds': () => this.geoTree ? ['enseigne', 'typologie', 'segmentMarketing', 'ensemble'] : ['typologie', 'segmentMarketing', 'ensemble'],
            'navNames': () => this.geoTree ? ['Enseigne', 'Typologie PdV', 'Seg. Mark.', 'Ensemble'] : ['Typologie PdV', 'Seg. Mark.', 'Ensemble'],
            'visibleColumns': [{field: 'name', flex: 1},{field: 'nbVisits', flex: 0.4},{field: 'graph', flex: 1, valueGetter: (params: any) => { if (params.data.groupRow) { let value = 0; params.api.forEachNode( function(node: any) {if (node.data.targetFinition && node.data[SliceTable.currentGroupField] === params.data.name.name && node.data.potential > 0) value+=node.data.potential}); return value; } else {return params.data.graph}}},{field: 'potential', flex: 0.4},{field: 'info', flex: 0.3},{field: 'targetFinition', flex: 0.3}],
            'specificColumns': ['graph', 'potential', 'typologie', 'info', 'targetFinition', 'id'],
            'customSort': (a: any, b: any) => {return b.potential - a.potential},
            'customGroupSort': (a: {}[], b: {}[]) => { return (<any>b[0]).potential - (<any>a[0]).potential },
            'groupRowConfig': (entry: any) => {
                let group: {}[] = [];
                group = group.concat({
                    'name': {'name': entry[0], 'number': entry[1].length},
                    'potential': entry[1].reduce((totalPotential: number, pdv: {}) => totalPotential + ((pdv as any).potential > 0 ? (pdv as any).potential : 0), 0),
                    'groupRow': true
                    })
                group = group.concat(entry[1]);
                return group;
            },
            'updatableColumns': ['nbVisits', 'graph', 'potential', 'targetFinition'],
        }
    }

    private customField: {[name: string]: (id: number, pdv: any) => {} | null}  = { //the way to compute them
        'siniatSales': (id: number, pdv: any) => {
            return PDV.findById(id)!.displayIndustrieSaleVolumes()['Siniat']
        },
        'totalSales': (id: number, pdv: any) => {
            return Object.entries(PDV.findById(id)!.displayIndustrieSaleVolumes()).reduce((totalSales: number, entry: any) => totalSales + entry[1], 0)
        },
        'graph': (id: number, pdv: any) => {
            let p2cdSales: any =  {}; let p2cdRaw = PDV.findById(id)!.displayIndustrieSaleVolumes()
            let enduitSales: any =  {}; let enduitRaw = PDV.findById(id)!.displayIndustrieSaleVolumes(true)
            p2cdSales['Siniat'] = {'value': p2cdRaw['Siniat']}
            for(let industry of ['Siniat', 'Placo', 'Knauf', 'Autres']) {
                p2cdSales[industry] = {'value': p2cdRaw[industry], 'color': SliceTable.getColor('industry', industry)}
            }
            for(let industry of ['Prégy', 'Salsi', 'Autres']) {
                enduitSales[industry] = {'value': enduitRaw[industry], 'color': SliceTable.getColor('indFinition', industry)}
            }
            return {'p2cd': p2cdSales, 'enduit': enduitSales};
        },
        'potential': (id: number, pdv: any) => {
            return PDV.findById(id)!.getPotential();
        },
        'typologie': (id: number, pdv: any) => {
            let list = PDV.findById(id)!.getValue('dn', false, true) as number[];
            for(let i = 0; i<list.length; i++) {
                if(list[i] === 1) return this.segmentDnEnduit[i+1]
            }
            return 'Could not be classified'
        },
        'edit': () => {
            return true; //should return what is inside the new div ?
        },
        'targetFinition': (id: number, pdv: any) => {
            return PDV.findById(id)!.targetFinition;
        },
        'checkboxP2cd': (id: number, pdv: any) => null,

        'clientProspectProperty': (id: number, pdv: any) => {
            let array: any = PDV.findById(id)!.getValue('dn', false, false, true);
            if(array[0] === 1) return DEH.get('clientProspect')[1]
            if(array[1] === 1) return DEH.get('clientProspect')[2]
            return DEH.get('clientProspect')[3]
        },
        'info': () => {
            return true;
        },
        'id': (id: number, pdv: any) => id,
    }

    constructor(private dataService: DataService, private sliceDice: SliceDice, @Inject(LOCALE_ID) public locale: string){
        PDV.load(false);
        this.pdvFields = DEH.get('structurePdvs');
        this.segmentDnEnduit = DEH.get('segmentDnEnduit')

        //Get idsToFields, to match id values in pdv to string values
        for(let field of this.pdvFields) {
            this.idsToFields[field] = DEH.get(field);
        }
    }


    pdvFromListToObject(pdv: any, id: number, type: string): any {
        let newPdv: {[key:string]:any} = {}; //concrete row of the table
        let allColumns = this.getAllColumns(type);
        for(let index = 0; index < Object.keys(allColumns).length; index ++) {
            let field = allColumns[index]
            if(this.idsToFields[field]) newPdv[field] = this.idsToFields[field][pdv[index]]
            else if(this.tableConfig[type]['specificColumns'].includes(field)) {
                let customValue = this.customField[field](id, pdv);
                if(customValue !== null) newPdv[field] = customValue;
            }
            else {
                newPdv[field] = PDV.findById(id)!.attribute(field)
            }
        }
        return newPdv
    }

    getPdvs(slice: any = {}, groupField: string, type: string): {[key:string]:any}[] { // Transforms pdv from lists to objects, and counts title informations
        let pdvs = PDV.sliceTree(slice, this.geoTree)[0];
        pdvs.sort(this.tableConfig[type]['customSort'])
        this.sortedPdvsList = pdvs;
        this.pdvsWithGroupslist = this.buildGroups(groupField, type);
        return this.pdvsWithGroupslist;
    }

    getAllColumns(type: string) {
        let allColumns = DEH.get('structurePdvs').concat(this.tableConfig[type]['specificColumns']);
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
            let column : any = {'field': visibleColumn.field, 'flex': visibleColumn.flex, 'hide': false, 'colSpan': (params: any) => {if(params.data.groupRow && params.colDef.field === 'potential') return 2; return 1}, 'cellStyle': (params: any) => {if(params.colDef.field != 'graph') return {display: 'flex'}; return;}}
            if(visibleColumn.valueGetter) column.valueGetter = visibleColumn.valueGetter; 
            columnDefs.push(column);
        }

        this.columnDefs = columnDefs; 
        return this.columnDefs;
    }

    getNavIds(type: string): string[] {
        return this.tableConfig[type]['navIds']();
    }

    getNavOpts(type: string): {id: any, name: any}[] {
        let array: {id: any, name: any}[] = []
        let navIds = this.tableConfig[type]['navIds']();
        let navNames = this.tableConfig[type]['navNames']();
        for(let i=0; i<navIds.length; i++) array.push({id: navIds[i], name: navNames[i]})
        return array;
    }

    initializeTitleData(type: string){
        this.titleData = this.tableConfig[type]['computeTitle']();
    }

    getTitleData(){
        return this.titleData;
    }

    getUpdatableColumns(type: string) {
        return this.tableConfig[type]['updatableColumns'];
    }

    static initializeTarget() {
        return [Math.floor(Date.now()/1000), true, true, true, 0, false, "", "", ""]
      }

    changeTargetTargetFinitions(pdv: PDV) {
        let list: any[] = pdv.getValues();
        if(!list[DEH.TARGET_ID]) list[DEH.TARGET_ID] = SliceTable.initializeTarget()
        if(pdv.potential > 0) {
            if(!pdv.targetFinition) {
                this.updateTotalTarget(pdv.potential)
                list[DEH.TARGET_ID][DEH.TARGET_FINITIONS_ID] = true;
                list[DEH.TARGET_FINITIONS_ID] = true;
            } else {
                this.updateTotalTarget(-pdv.potential)
                list[DEH.TARGET_ID][DEH.TARGET_FINITIONS_ID] = false;
                list[DEH.TARGET_FINITIONS_ID] = false;
            }
        }
        this.dataService.updatePdv(list, pdv.id)
    }

    updateTotalTarget(increment: number) {
        this.titleData[1]+=increment
    }


    getData(slice: any = {}, rowGroupId: string, type: string): {}[][]{
        let data: {}[][] = [];
        this.geoTree = this.sliceDice.geoTree;
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

    getRowColor(id: number): string {
        let pdvInstance = PDV.findById(id)!;
        let isAdOpen = DEH.get('params')['isAdOpen']
        if(pdvInstance.onlySiniat === true || pdvInstance.sale === false || pdvInstance.redistributed === false || (pdvInstance.target && (!pdvInstance.target[DEH.TARGET_SALE_ID] || !pdvInstance.attribute('target')[DEH.TARGET_REDISTRIBUTED_ID])) || isAdOpen === false)
            return 'black'

        for(let sale of pdvInstance.salesObject) {
            if(Math.floor(Date.now()/1000) - 15778476 <= sale.date && sale.industryId !== DEH.INDUSTRIE_SINIAT_ID && sale.volume > 0)
                return 'black';
        }

        for(let sale of pdvInstance.salesObject) {
            if(sale.industryId != DEH.INDUSTRIE_SINIAT_ID && sale.volume > 0) return 'orange'
        }

        return 'red'
    }

    static getColor(axis: string, enseigne: string): string {
        let hardCodedColors: {[key: string]: {[key: string]: string}} = {
            'industry': {
            'Siniat': '#A61F7D',
            'Placo': '#0056A6',
            'Knauf': '#67D0FF',
            'Autres': '#888888',
            },
            'indFinition': {
            'Prégy': '#7B145C',
            'Salsi': '#D00000',
            'Autres': '#B0B0B0'
            }
        }
        return hardCodedColors[axis][enseigne];
    }
  
    pdvFromObjectToList(pdv: PDV) { //operation inverse de la construction de row du tableau
        let pdvAsList = []
        for(let field of DEH.get('structurePdvs')) {
            if(this.idsToFields[field]) {
                for(let [id, fieldValue] of Object.entries(this.idsToFields[field])) {
                    if(fieldValue === pdv.attribute(field)) {
                        pdvAsList.push(id)
                        break;
                    }
                }
            } else pdvAsList.push(pdv.attribute(field))
        }
        return pdvAsList;
    }
}