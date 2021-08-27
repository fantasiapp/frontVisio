

export class Dashboard  {

    private DashboardName = ''
    private DashboardId

    constructor( DashboardId:number, DashboardName:string,) {
        this.DashboardId = DashboardId
        this.DashboardName = DashboardName
     }
    getDashboardId():number{
        return this.DashboardId
    }
    getDashboardName() :string{
        return this.DashboardName
    }
  
}