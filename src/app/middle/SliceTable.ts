import { Injectable } from "@angular/core";
import DataExtractionHelper from "./DataExtractionHelper";
import { PDV } from "./Slice&Dice";

@Injectable()
export class SliceTable {
    private sortedPdvsList: {}[] = [];
    private pdvsWithGroupslist: {}[] = [];
    private pdvFields: string[];
    private segmentDnEnduit: {[id: number]: string} = {};
    private idsToFields: {[key: string]: {[key: number]: string}[]} = {};
    private columnDefs: {[k: string]: any}[] = [];
    private idIndustries: {[key: string]: number} = {};
    private preProcessedData: {} = {};
    
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
            'visibleColumns': [{field: 'name', flex: 1}, {field: 'siniatSales', flex: 1}, {field: 'totalSales', flex: 1}, {field: 'edit', flex: 0}, {field: 'checkbox', flex: 0}, {field: 'pointFeu', flex: 0}],
            'specificColumns': ['clientProspect', 'siniatSales', 'totalSales', 'edit', 'checkbox'],
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
            // 'preProcess': (pdv: any) => {
            //     let p2cdSalesRaw: number[] = this.getPdvInstance(pdv)!.getValue('p2cd', true) as number[];
            //     let enduitSalesRaw: number[] = this.getPdvInstance(pdv)!.getValue('enduit', false, true) as number[];
            //     let siniatP2cdSale = p2cdSalesRaw[this.idIndustries['Siniat']]; let placoP2cdSale = p2cdSalesRaw[this.idIndustries['Placo']]; let knaufP2cdSale = p2cdSalesRaw[this.idIndustries['Knauf']];
            //     let pregyEnduitSale = enduitSalesRaw[0]; let salsiEnduitSale = enduitSalesRaw[1];
            //     /* Target */
            //     let p2cdSales: {}[] = []; let enduitSales: {}[] = [];
            //     p2cdSales.push({'enseigne': 'Siniat', 'value': siniatP2cdSale, color: this.getColor('industry', 'Siniat')})
            //     p2cdSales.push({'enseigne': 'Placo', 'value': placoP2cdSale, color: this.getColor('industry', 'Placo')})
            //     p2cdSales.push({'enseigne': 'Knauf', 'value': knaufP2cdSale, color: this.getColor('industry', 'Knauf')})
            //     p2cdSales.push({'enseigne': 'Autres', 'value': p2cdSalesRaw
            //                         .filter((value, index) => {![this.idIndustries['Siniat'], this.idIndustries['Placo'], this.idIndustries['Knauf']].includes(index)})
            //                         .reduce((total: number, value: number) => total + value, 0)
            //                     ,color: this.getColor('industry', 'Challengers')})
            //     enduitSales.push({'enseigne': 'Pregy', 'value': pregyEnduitSale, color: this.getColor('indFinition', 'Pregy')})
            //     enduitSales.push({'enseigne': 'Salsi', 'value': salsiEnduitSale, color: this.getColor('indFinition', 'Salsi')})
            //     enduitSales.push({'enseigne': 'Autres', 'value': enduitSalesRaw[2]+enduitSalesRaw[3], color: this.getColor('indFinition', 'Croissance')})
            //     /* Potential */
            //     let totalP2cdSale = p2cdSalesRaw.filter((value, index) => {![this.idIndustries['Siniat'], this.idIndustries['Placo'], this.idIndustries['Knauf']].includes(index)})
            //     .reduce((total: number, value: number) => total + value, 0)
            //     let potential = siniatP2cdSale > 0.1*totalP2cdSale ? (0.36*siniatP2cdSale) - pregyEnduitSale - salsiEnduitSale : (0.36*totalP2cdSale) - pregyEnduitSale - salsiEnduitSale;
            //     /* Typologie */
            //     let typologie = ''; let list = this.getPdvInstance(pdv)!.getValue('dn', false, true);
            //     if ((<number[]>list)[0] === 1) typologie = this.segmentDnEnduit[1];
            //     else if ((<number[]>list)[1] === 1) typologie = this.segmentDnEnduit[2];
            //     else typologie = this.segmentDnEnduit[3];

            //     this.preProcessedData = {'typologie': typologie, 'target': {'p2cd': p2cdSales, 'enduit': enduitSales}, 'potential': potential, 'info': {'enseigne': pdv.enseigne, 'dep': pdv.dep, 'typologie': typologie, }};
            // },
        },

        'enduit': {
            'computeTitle': () =>[
                this.sortedPdvsList.length,
                Math.floor(this.pdvsWithGroupslist.reduce((totalTarget: number, pdv: any) => totalTarget + (pdv.groupRow === true ? pdv.target : 0),0)),
                Math.floor(this.sortedPdvsList.reduce((totalPotential: number, pdv: any) => totalPotential + (pdv.potential > 0 ? pdv.potential : 0),0)/1000)
                ],            'navIds': ['enseigne', 'typologie', 'segmentMarketing', 'ensemble'],
            'navNames': ['Enseigne', 'Typologie PdV', 'Seg. Mark.', 'Ensemble'],
            'visibleColumns': [{field: 'name', flex: 1},{field: 'nbVisits', flex: 0.4},{field: 'target', flex: 1},{field: 'potential', flex: 0.4},{field: 'info', flex: 0.3},{field: 'checkbox', flex: 0.3}],
            'specificColumns': ['target', 'potential', 'typologie', 'info', 'checkbox'],
            'customSort': (a: any, b: any) => {return b.potential - a.potential},
            'customGroupSort': (a: {}[], b: {}[]) => { return (<any>b[0]).potential - (<any>a[0]).potential },
            'groupRowConfig': (entry: any) => {
                let group: {}[] = [];
                group = group.concat({
                    'name': {'name': entry[0], 'number': entry[1].length},
                    'target': 10.2,
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
            return pdv[DataExtractionHelper.getKeyByValue(DataExtractionHelper.get('structurePdv'), 'sales') as any].filter((sale: number[]) => ([1,2,3]
                .includes(sale[1]) && sale[0] === 1))
                .reduce((siniatSales: number, sale: number[]) => siniatSales + sale[2], 0);
        },
        'totalSales': (pdv: any) => {
            return pdv[DataExtractionHelper.getKeyByValue(DataExtractionHelper.get('structurePdv'), 'sales') as any].filter((sale: number[]) => ([1,2,3]
                .includes(sale[1])))
                .reduce((siniatSales: number, sale: number[]) => siniatSales + sale[2], 0);
        },
        'target': (pdv: any) => {
            let p2cdSalesRaw: number[] = this.getPdvInstance(pdv)!.getValue('p2cd', true) as number[];
            let enduitSalesRaw: number[] = this.getPdvInstance(pdv)!.getValue('enduit', false, true) as number[];

            let p2cdSales: any =  {};
            let enduitSales: any =  {};
            p2cdSales['Siniat'] = {'value': p2cdSalesRaw[this.idIndustries['Siniat']], color: this.getColor('industry', 'Siniat')}
            p2cdSales['Placo'] = {'value': p2cdSalesRaw[this.idIndustries['Placo']], color: this.getColor('industry', 'Placo')}
            p2cdSales['Knauf'] = {'value': p2cdSalesRaw[this.idIndustries['Knauf']], color: this.getColor('industry', 'Knauf')}
            p2cdSales['Autres'] = {'value': p2cdSalesRaw
                                .filter((value, index) => {![this.idIndustries['Siniat'], this.idIndustries['Placo'], this.idIndustries['Knauf']].includes(index)})
                                .reduce((total: number, value: number) => total + value, 0)
                            ,color: this.getColor('industry', 'Challengers')}

            enduitSales['Pregy'] = {'value': enduitSalesRaw[0], color: this.getColor('indFinition', 'Pregy')}
            enduitSales['Salsi'] = {'value': enduitSalesRaw[1], color: this.getColor('indFinition', 'Salsi')}
            enduitSales['Autres'] = {'value': enduitSalesRaw[2]+enduitSalesRaw[3], color: this.getColor('indFinition', 'Croissance')}
            return {'p2cd': p2cdSales, 'enduit': enduitSales};
        },
        'potential': (pdv: any) => {
            let p2cdSalesRaw: number[] = this.getPdvInstance(pdv)!.getValue('p2cd', true) as number[];
            let siniatSale = p2cdSalesRaw[this.idIndustries['Siniat']];
            let totalSale = p2cdSalesRaw.filter((value, index) => {![this.idIndustries['Siniat'], this.idIndustries['Placo'], this.idIndustries['Knauf']].includes(index)})
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
        'checkbox': () => {
            return false; //Could be check by default ?
        },
        'clientProspect': (pdv: any) => {
            let array: any = this.getPdvInstance(pdv)!.getValue('dn', false, false, true);
            if(array[0] === 1) return DataExtractionHelper.get('clientProspect')[1]
            if(array[1] === 1) return DataExtractionHelper.get('clientProspect')[2]
            return DataExtractionHelper.get('clientProspect')[3]
        },
        'info': () => {
            return true;
        }
    }

    constructor(){
        PDV.load(false);
        this.pdvFields = DataExtractionHelper.get('structurePdv');
        this.segmentDnEnduit = DataExtractionHelper.get('segmentDnEnduit')

        //Get idsToFields, to match id values in pdv to string values
        for(let field of this.pdvFields) {
            this.idsToFields[field] = DataExtractionHelper.get(field);
        }

                    // ⚠️⚠️⚠️ Début à 0 ? Ou à 1 ? ⚠️⚠️⚠️

        this.idIndustries = {'Siniat': 0, 'Placo': 2, 'Knauf': 5}

    }

    getPdvs(slice: any = {}, groupField: string, type: string): {[key:string]:any}[] { // Transforms pdv from lists to objects, and counts title informations
        let pdvs = []
        if (slice !== {}){
            let allPdvs = DataExtractionHelper.get('pdvs');
            for(let pdvInfo of PDV.sliceTree(slice)[0]) {
                let newPdv = allPdvs[pdvInfo.id];
                newPdv.instanceId = pdvInfo.id; //rewriting pdv code (as we never use it)
                pdvs.push(newPdv);
            }
        }
        let pdvsAsList =  [];
        for(let pdv of pdvs) {
            var newPdv: {[key:string]:any} = {}; //concrete row of the table
            for(let index = 0; index < Object.keys(this.getAllColumns(type)).length; index ++) {
                let field = this.getAllColumns(type)[index]
                if(this.idsToFields[field]) newPdv[field] = this.idsToFields[field][pdv[index]]
                else if(this.tableConfig[type]['specificColumns'].includes(field)) newPdv[field] = this.customField[field](pdv);
                else newPdv[field] = pdv[index]
            }
            pdvsAsList.push(newPdv);
        }
        
        pdvsAsList.sort(this.tableConfig[type]['customSort'])
        this.sortedPdvsList = pdvsAsList;
        this.pdvsWithGroupslist = this.buildGroups(groupField, type);
        return this.pdvsWithGroupslist;
    }

    getAllColumns(type: string) {
        let allColumns = this.pdvFields.concat(this.tableConfig[type]['specificColumns']);
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
            let column: any = {'field': visibleColumn.field, 'flex': visibleColumn.flex, 'hide': false, 'colSpan': (params: any) => 1}
            if(column.field === 'potential') column.colSpan = (params : any) => {return params.data.groupRow === true ? 3 : 1; };
            if(column.field === 'edit' || column.field === 'checkbox' || column.field === 'pointFeu') column.width = 50;
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

    getTitleData(type: string){
        return this.tableConfig[type]['computeTitle']();
    }

    getData(slice: any = {}, rowGroupId: string, type: string): {}[][]{
        let data: {}[][] = [];
        data.push(this.getColumnDefs(type, rowGroupId));
        data.push(this.getPdvs(slice, rowGroupId, type));
        data.push(this.getNavOpts(type));
        data.push(this.getTitleData(type));
        return data;
    }

    getGroupsData(type: string, id: string) {
        return this.getColumnDefs(type, id);
    }

    buildGroups(groupField: string, type: string) {
        let pdvsByGroup = new Map<string, {}[]>();
        for(let pdv of this.sortedPdvsList){
            if(pdvsByGroup.get((pdv as any)[groupField]) === undefined) pdvsByGroup.set((pdv as any)[groupField], [pdv]);
            else pdvsByGroup.get((pdv as any)[groupField])!.push(pdv);
        }
        let groupList: {}[][] = [];
        for(let entry of pdvsByGroup.entries()) groupList.push(this.tableConfig[type]['groupRowConfig'](entry))
        groupList.sort(this.tableConfig[type]['customGroupSort']);
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
}