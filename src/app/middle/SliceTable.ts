import { Injectable, LOCALE_ID, Inject  } from "@angular/core";
import { DataService } from "../services/data.service";
import DEH from "./DataExtractionHelper";
import { PDV, SliceDice } from "./Slice&Dice";

type GroupRow = { //Built to behave like a PDV type for the table component
    name: {
        name: string;
        number: number;
    };
    siniatSales?: number;
    totalSales?: number;
    potential?: number;
    groupRow: boolean;
}

@Injectable({
    providedIn: 'root'
  })
export class SliceTable {
    private sortedPdvsList: PDV[] = [];
    private pdvsWithGroupslist: PDV[] = [];
    groupInfos: {field: string, values: string[]} = {field : '', values: []};
    private titleData: number[] = [0,0,0];
    private columnDefs: {[k: string]: any}[] = [];

    static currentGroupField: string = "enseigne";

    //type : 'p2cd' or 'enduit'
    private tableConfig : {[type: string]: {[property: string]: any}} = {
        'p2cd': {
            'computeTitle': () =>[
                this.sortedPdvsList.length,
                this.sortedPdvsList.reduce((totalSiniat: number, pdv: PDV) => totalSiniat + pdv.siniatSales,0),
                this.sortedPdvsList.reduce((totalSales: number, pdv: PDV) => totalSales + pdv.totalSales,0)
                ],
            'navIds': () => this.sliceDice.geoTree ? ['enseigne', 'clientProspect', 'segmentMarketing', 'segmentCommercial', 'ensemble'] : ['clientProspect', 'segmentMarketing', 'segmentCommercial', 'ensemble'],
            'navNames': () => this.sliceDice.geoTree ? ['Enseigne', 'Client prosp.', 'Seg. Mark', 'Seg. Port.', 'Ensemble'] : ['Client prosp.', 'Seg. Mark', 'Seg. Port.', 'Ensemble'],
            'visibleColumns': [
                {field: 'name', flex: 1},
                {field: 'siniatSales', flex: 1},
                {field: 'totalSales', flex: 1},
                {field: 'edit', flex: 0.35},
                {field: 'checkboxP2cd', flex: 0.35, valueGetter: 
                    (params : any) => {
                        if (params.data.groupRow) return false;
                        else {
                            if (!params.data.target) return false;
                            else return params.data.target[5] !== 'r'
                        }
                    }
                },
                {field: 'pointFeu', flex: 0.35}],
            'customSort': (a: PDV, b: PDV) => {return b.totalSales - a.totalSales},
            'customGroupSort': (a: PDV[], b: PDV[]) => { return b[0].totalSales - a[0].totalSales },
            'groupRowConfig': (group: {groupKey: string, pdvs: PDV[]}) => {
                let groupAsList: (PDV|GroupRow)[] = [];
                let groupRow: GroupRow = {
                    'name': {'name': group.groupKey, 'number': group.pdvs.length},
                    'siniatSales' : group.pdvs.reduce((totalSiniatSales: number, pdv: PDV) => totalSiniatSales + pdv.siniatSales, 0),
                    'totalSales' : group.pdvs.reduce((totalTotalSales: number, pdv: PDV) => totalTotalSales + pdv.totalSales, 0),
                    'groupRow' : true
                    }
                    groupAsList = groupAsList.concat(groupRow)
                    groupAsList = groupAsList.concat(group.pdvs);
                return groupAsList;
            }
        },

        'enduit': {
            'computeTitle': () =>[
                this.sortedPdvsList.length,
                this.sortedPdvsList.reduce((totalTarget: number, pdv: PDV) => totalTarget + (pdv.potential > 0  && pdv.targetFinition === true ? pdv.potential : 0),0),
                this.sortedPdvsList.reduce((totalPotential: number, pdv: PDV) => totalPotential + (pdv.potential > 0 ? pdv.potential : 0),0)
                ],
            'navIds': () => this.sliceDice.geoTree ? ['enseigne', 'typology', 'segmentMarketing', 'ensemble'] : ['typology', 'segmentMarketing', 'ensemble'],
            'navNames': () => this.sliceDice.geoTree ? ['Enseigne', 'Typologie PdV', 'Seg. Mark.', 'Ensemble'] : ['Typologie PdV', 'Seg. Mark.', 'Ensemble'],
            'visibleColumns': [
                {field: 'name', flex: 1},
                {field: 'nbVisits', flex: 0.4},
                {field: 'graph', flex: 1, valueGetter: 
                    (params: any) => {
                        if (params.data.groupRow) {
                            let value = 0; params.api.forEachNode(function(node: any)
                            {
                                if (node.data.targetFinition && node.data[SliceTable.currentGroupField] === params.data.name.name && node.data.potential > 0) value+=node.data.potential
                            });
                            return value; 
                        }
                        else return params.data.graph
                    }
                },
                {field: 'potential', flex: 0.4},{field: 'info', flex: 0.3},
                {field: 'targetFinition', flex: 0.3}],
            'customSort': (a: PDV, b: PDV) => {return b.potential - a.potential},
            'customGroupSort': (a: PDV[], b: PDV[]) => { return b[0].potential - a[0].potential },
            'groupRowConfig': (group: {groupKey: string, pdvs: PDV[]}) => {
                let groupAsList: (PDV|GroupRow)[] = [];
                let groupRow: GroupRow = {
                    'name': {'name': group.groupKey, 'number': group.pdvs.length},
                    'potential': group.pdvs.reduce((totalPotential: number, pdv:PDV) => totalPotential + (pdv.potential > 0 ? pdv.potential : 0), 0),
                    'groupRow': true
                }
                groupAsList = groupAsList.concat(groupRow)
                groupAsList = groupAsList.concat(group.pdvs);
                return groupAsList;
            }
        }
    }

    constructor(private dataService: DataService, private sliceDice: SliceDice, @Inject(LOCALE_ID) public locale: string){}

    getPdvs(slice: any, groupField: string, type: string): PDV[] { // Transforms pdv from lists to objects, and counts title informations
        this.sortedPdvsList = PDV.sliceTree(slice, this.sliceDice.geoTree)[0];
        this.sortedPdvsList.sort(this.tableConfig[type]['customSort'])
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

    computeTitleData(type: string){
        this.titleData = this.tableConfig[type]['computeTitle']();
    }

    getTitleData(){
        return this.titleData;
    }

    getData(slice: any = {}, rowGroupId: string, type: string): {}[][]{
        let data: {}[][] = [];
        data.push(this.getColumnDefs(type, rowGroupId));
        data.push(this.getPdvs(slice, rowGroupId, type));
        data.push(this.getNavOpts(type));
        this.computeTitleData(type);
        data.push([this.groupInfos])
        return data;
    }

    getGroupsData(type: string, id: string) {
        return this.getColumnDefs(type, id);
    }

    buildGroups(groupField: string, type: string) {
        SliceTable.currentGroupField = groupField;
        let pdvsByGroup = new Map<string, PDV[]>();
        for(let pdv of this.sortedPdvsList){
            if(pdvsByGroup.get(pdv.attribute(groupField)) === undefined) pdvsByGroup.set(pdv.attribute(groupField), [pdv]);
            else pdvsByGroup.get(pdv.attribute(groupField))!.push(pdv);
        }
        let groupList: PDV[][] = [];
        for(let key of pdvsByGroup.keys()) groupList.push(this.tableConfig[type]['groupRowConfig']({groupKey: key, pdvs: pdvsByGroup.get(key)}))
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

    static getGraphColor(axis: string, enseigne: string): string {
        let hardCodedColors: {[key: string]: {[key: string]: string}} = {
            'industry': {
            'Siniat': '#A61F7D', //["industryP2CD", "Siniat", "#B3007E"]
            'Placo': '#0056A6', //["industryP2CD", "Placo", "#0056A6"]
            'Knauf': '#67D0FF', //["industryP2CD", "Knauf", "#67D0FF"]
            'Autres': '#888888', //["industry", "Challengers", "#888888"]
            },
            'indFinition': {
            'Prégy': '#7B145C', //["indFinition", "Prégy", "#B3007E"]
            'Salsi': '#D00000', //["indFinition", "Salsi", "#D00000"]
            'Autres': '#B0B0B0' //["indFinition", "Croissance", "#DEDEDE"]
            }
        }
        return hardCodedColors[axis][enseigne];
    }

    /*** From the table component, only way to modify the data ***/
    changeTargetTargetFinitions(pdv: PDV) {
        if(!pdv.target) pdv.initializeTarget();
        (pdv.target as any[])[DEH.TARGET_ID][DEH.TARGET_FINITIONS_ID] = !pdv.targetFinition && pdv.potential > 0;
        this.computeTitleData('enduit');
        this.dataService.updatePdv(pdv.getValues(), pdv.id)
    }
}