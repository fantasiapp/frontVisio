import { Injectable, LOCALE_ID, Inject  } from "@angular/core";
import { DataService } from "../services/data.service";
import DEH from "./DataExtractionHelper";
import { SliceDice } from "./Slice&Dice";
import { PDV } from "./Pdv";
import {Node} from './Node';

/**
 * The tableComponent is the only Widget using the AgGrid library
 * TableSlice implements the specific function this library needs, and relies as much as possible on existing methods in SliceDice
 */


                      /**************/
                      /*  Strucures */
                      /**************/   // Used to type the variables, and make use of TypeScript


/** Built to behave like a PDV type for the AgGrid **/
type GroupRow = {
    name: {
        name: string;
        number: number;
    };
    siniatSales?: number;
    totalSales?: number;
    potential?: number;
    groupRow: boolean;
}

/** Used by AgGrid to define a column **/
interface ColumnConfig {
    field: string;
    hide: boolean;
    flex?: number;
    valueGetter?: (params: any) => any;
    colSpan?: (params: any) => number;
    cellStyle?: (params: any) => any;
}

/** Structure passed to TableComponent to initiate its variables **/
export type TableData = {
    columnDefs: {[k: string]: any}[];
    navOpts: {id: any, name: any}[];
    pdvs: PDV[];
    colInfos: {field: string, values: string[]};
}

/** All hard-coded variables are built for theses 2 possible table types **/
export enum TableTypes {
    p2cd = 'p2cd',
    enduit = 'enduit'
  }

/** Properties I chose to define a TableComponent (using AgGrid) **/
enum TableProperties {
    computeTitle = 'computeTitle',
    navIds = 'navIds',
    navNames = 'navNames',
    visibleColumns = 'visibleColumns',
    customSort = 'customSort',
    customGroupSort = 'customGroupSort',
    groupRowConfig = 'groupRowConfig'
}

@Injectable({
    providedIn: 'root'
  })
@Injectable()
export class SliceTable {

                      /**************/
                      /*  Variables */
                      /**************/

    private sortedPdvsList: PDV[] = []; //List of all pdvs during the building of a Table
    private pdvsWithGroupslist: PDV[] = []; //Sorted list of all pdvs + GroupRow instances to provide the agGrid component
    groupInfos: {field: string, values: string[]} = {field : '', values: []};

    static currentGroupField: string = "enseigne";

    private tableConfig : {[type in TableTypes]: {[property in TableProperties]: any}} = {
        'p2cd': {
                'computeTitle':     () => [
                                        this.sortedPdvsList.length,
                                        this.sortedPdvsList.reduce((totalSiniat: number, pdv: PDV) => totalSiniat + pdv.siniatSales,0),
                                        this.sortedPdvsList.reduce((totalSales: number, pdv: PDV) => totalSales + pdv.totalSales,0)
                                     ],
                'navIds':           () => this.sliceDice.geoTree ? ['enseigne', 'clientProspect', 'segmentMarketing', 'segmentCommercial', 'ensemble'] : ['clientProspect', 'segmentMarketing', 'segmentCommercial', 'ensemble'],
                'navNames':         () => this.sliceDice.geoTree ? ['Enseigne', 'Client prosp.', 'Seg. Mark', 'Seg. Port.', 'Ensemble'] : ['Client prosp.', 'Seg. Mark', 'Seg. Port.', 'Ensemble'],
                'visibleColumns':   [
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
                                        {field: 'pointFeu', flex: 0.35}
                                    ],
                'customSort':       (a: PDV, b: PDV) => {return b.totalSales - a.totalSales},
                'customGroupSort':  (a: PDV[], b: PDV[]) => { return b[0].totalSales - a[0].totalSales },
                'groupRowConfig':   (group: {groupKey: string, pdvs: PDV[]}) => {
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
                'computeTitle':     () => [
                                        this.sortedPdvsList.length,
                                        this.sortedPdvsList.reduce((totalTarget: number, pdv: PDV) => totalTarget + (pdv.potential > 0  && pdv.targetFinition === true ? pdv.potential : 0),0),
                                        this.sortedPdvsList.reduce((totalPotential: number, pdv: PDV) => totalPotential + (pdv.potential > 0 ? pdv.potential : 0),0)
                                    ],
                'navIds':           () => this.sliceDice.geoTree ? ['enseigne', 'typology', 'segmentMarketing', 'ensemble'] : ['typology', 'segmentMarketing', 'ensemble'],
                'navNames':         () => this.sliceDice.geoTree ? ['Enseigne', 'Typologie PdV', 'Seg. Mark.', 'Ensemble'] : ['Typologie PdV', 'Seg. Mark.', 'Ensemble'],
                'visibleColumns':   [
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
                                        {field: 'targetFinition', flex: 0.3}
                                    ],
                'customSort':       (a: PDV, b: PDV) => {return b.potential - a.potential},
                'customGroupSort':  (a: PDV[], b: PDV[]) => { return b[0].potential - a[0].potential },
                'groupRowConfig':   (group: {groupKey: string, pdvs: PDV[]}) => {
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

                      /********************************************/
                      /*  Private methods used for data computing */
                      /********************************************/

    constructor(private dataService: DataService, private sliceDice: SliceDice, @Inject(LOCALE_ID) public locale: string){}

    getPdvs(type: TableTypes): PDV[] { // Transforms pdv from lists to objects, and counts title informations
        this.sortedPdvsList = SliceDice.currentSlice;
        this.sortedPdvsList.sort(this.tableConfig[type]['customSort'])
        this.pdvsWithGroupslist = this.buildGroups(type);
        return this.pdvsWithGroupslist;
    }

    private getAllHiddenColumns(type: TableTypes) {
        let visibleFields = this.tableConfig[type]['visibleColumns'].map((val: {'field': string}) => val.field);
        return DEH.get('structurePdvs').filter((field: string) => !visibleFields.includes(field));;
    }

    private getColumnDefs(type: TableTypes): ColumnConfig[]{
        let columnDefs: ColumnConfig[] = [];

        for(let field of this.getAllHiddenColumns(type)) { //first all hidden fields
            let column: ColumnConfig = {'field': field, 'hide': true}
            columnDefs.push(column);
        }
        for(let visibleColumn of this.tableConfig[type]['visibleColumns']) { //then visible, to ensure order
            let column : ColumnConfig = {
                'field': visibleColumn.field,
                'flex': visibleColumn.flex,
                'hide': false,
                'colSpan': (params: any) => {if(params.data.groupRow && params.colDef.field === 'potential') return 2; return 1},
                'cellStyle': (params: any) => {if(params.colDef.field != 'graph') return {display: 'flex'}; return;}}
            if(visibleColumn.valueGetter) column.valueGetter = visibleColumn.valueGetter;
            columnDefs.push(column);
        }

        return columnDefs;
    }

                      /**************************************/
                      /*  Public methods for TableComponent */
                      /**************************************/

    public getNavIds(type: TableTypes): string[] {
        return this.tableConfig[type]['navIds']();
    }

    getNavOpts(type: TableTypes): {id: any, name: any}[] {
        let array: {id: any, name: any}[] = []
        let navIds = this.tableConfig[type]['navIds']();
        let navNames = this.tableConfig[type]['navNames']();
        for(let i=0; i<navIds.length; i++) array.push({id: navIds[i], name: navNames[i]})
        return array;
    }

    computeTitle(type: TableTypes){
        return this.tableConfig[type]['computeTitle']();;
    }

    getData(type: TableTypes): TableData{
        return {columnDefs: this.getColumnDefs(type), navOpts: this.getNavOpts(type), pdvs: this.getPdvs(type), colInfos: this.groupInfos};
    }

    buildGroups(type: TableTypes) {
        let pdvsByGroup = new Map<string, PDV[]>();
        for(let pdv of this.sortedPdvsList){
            if(pdvsByGroup.get(pdv[SliceTable.currentGroupField as keyof PDV]) === undefined) pdvsByGroup.set(pdv[SliceTable.currentGroupField as keyof PDV], [pdv]);
            else pdvsByGroup.get(pdv[SliceTable.currentGroupField as keyof PDV])!.push(pdv);
        }
        let groupList: PDV[][] = [];
        for(let key of pdvsByGroup.keys()) groupList.push(this.tableConfig[type]['groupRowConfig']({groupKey: key, pdvs: pdvsByGroup.get(key)}))
        groupList.sort(this.tableConfig[type]['customGroupSort']);
        this.groupInfos.field = SliceTable.currentGroupField;
        this.groupInfos.values = Array.from(pdvsByGroup.keys());
        return groupList.flat()
    }

    getRowColor(pdv: PDV): string {
        let isAdOpen = DEH.get('params')['isAdOpen']
        if(pdv.onlySiniat === true || pdv.sale === false || pdv.redistributed === false || (pdv.target && (!pdv.target[DEH.TARGET_SALE_ID] || !pdv.target[DEH.TARGET_REDISTRIBUTED_ID])) || isAdOpen === false)
            return 'black'

        for(let sale of pdv.salesObject) {
            if(Math.floor(Date.now()/1000) - 15778476 <= sale.date && sale.industryId !== DEH.INDUSTRIE_SINIAT_ID && sale.volume > 0)
                return 'black';
        }

        for(let sale of pdv.salesObject) {
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

                      /**************************/
                      /*  Methods updating Data */
                      /**************************/

    /*** From the table component, only way to modify the data ***/
    changeTargetTargetFinitions(pdv: PDV) {
        if(!pdv.target) pdv.initializeTarget();
        pdv.changeTargetTargetFinitions(!pdv.targetFinition && pdv.potential > 0)
        this.dataService.updatePdv(pdv.getValues(), pdv.id)

    }
}