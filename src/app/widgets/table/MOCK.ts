export abstract class MOCK_DATA {

    
    // static getRowData(): P2CDRow[] {
    //     return [
    //         {name: "Nom 1", siniatSells: 51054, totalSells: 1015304, brand: "POINT P", clientOrProspect: true, markSeg: "Purs Specialistes", portSeg: "A2", ensemble: "ENSEMBLE B" },
    //         {name: "Nom 2", siniatSells: 5146, totalSells: 4186541, brand: "POINT P", clientOrProspect: true, markSeg: "Purs Specialistes", portSeg: "A1", ensemble: "ENSEMBLE A" },
    //         {name: "Nom 3", siniatSells: 0, totalSells: 64404, brand: "POINT P", clientOrProspect: false, markSeg: "Purs Specialistes", portSeg: "B2", ensemble: "ENSEMBLE B" },
    //         {name: "Nom 4", siniatSells: 8854, totalSells: 335355, brand: "CMEM", clientOrProspect: true, markSeg: "Purs Specialistes", portSeg: "A1", ensemble: "ENSEMBLE C" },
    //         {name: "Nom 5", siniatSells: 27, totalSells: 35135, brand: "CMEM", clientOrProspect: true, markSeg: "Purs Specialistes", portSeg: "A1", ensemble: "ENSEMBLE D" },
    //         {name: "Nom 6", siniatSells: 8536, totalSells: 51636, brand: "CMEM", clientOrProspect: true, markSeg: "Purs Specialistes", portSeg: "C2", ensemble: "ENSEMBLE D" },
    //         {name: "Nom 7", siniatSells: 0, totalSells: 65345, brand: "POINT P", clientOrProspect: false, markSeg: "Purs Specialistes", portSeg: "A2", ensemble: "ENSEMBLE C" },
    //         {name: "Nom 8", siniatSells: 0, totalSells: 546354, brand: "POINT P", clientOrProspect: false, markSeg: "Purs Specialistes", portSeg: "A5", ensemble: "ENSEMBLE B" },
    //         {name: "Nom 9", siniatSells: 721, totalSells: 5304, brand: "MINECRAFT", clientOrProspect: true, markSeg: "Purs Specialistes", portSeg: "Z48", ensemble: "ENSEMBLE A" },
    //         {name: "Nom 10", siniatSells: 6485, totalSells: 13544, brand: "MINECRAFT", clientOrProspect: true, markSeg: "Purs Specialistes", portSeg: "A1", ensemble: "ENSEMBLE B" },
    //         {name: "Nom 11", siniatSells: 6715, totalSells: 123456, brand: "MINECRAFT", clientOrProspect: true, markSeg: "Purs Specialistes", portSeg: "C2", ensemble: "ENSEMBLE C" },
    //         {name: "Nom 12", siniatSells: 85415, totalSells: 987654, brand: "POKEMON", clientOrProspect: true, markSeg: "Purs Specialistes", portSeg: "C2", ensemble: "ENSEMBLE D" },
    //     ];
    // }
  
    static getInitialColumnDefs() {
        return [
            { field: 'brand', hide: true, rowGroup: true},
            { field: 'clientOrProspect', hide: true},
            { field: 'markSeg', hide: true},
            { field: 'portSeg', hide: true},
            { field: 'ensemble', hide: true},
            { field: 'name' },
            { field: 'siniatSells' },
            { field: 'totalSells'}
        ];
    }

    static getNavIds() {
        return ['enseigne', 'available', 'segmentMarketing', 'segmentCommercial', 'ensemble'];
    }
    static getNavNames() {
        return ['Enseigne', 'Client prosp.', 'Seg. Mark', 'Seg. Port.', 'Ensemble'];
    }
    static getNavOpts(): {id: any, name: any}[] {
        let array: {id: any, name: any}[] = []
        let navIds = this.getNavIds();
        let navNames = this.getNavNames();
        for(let i=0; i<navIds.length; i++) {
            array.push({id: navIds[i], name: navNames[i]})
        }
        return array;
    }

    static getVisibleColumns() {
        return ['name', 'dep', 'bassin']
    }
    
}


interface P2CDRow {
    name: string;
    siniatSells: number;
    totalSells: number;
    brand: string;
    clientOrProspect: boolean;
    markSeg: string;
    portSeg: string;
    ensemble: string;
  }