import Pipes from './pipes';

class Dashboard {
  //Most dashboards are re-used, don't create extra objects.
  private static instances: { [key:number]: Dashboard } = {};
  static byId(id: number): Dashboard | null {
    if ( id in this.instances )
        return this.instances[id];
    return null;
  }
  
  //load all dashboards from Pipes.data
  static fromData() {
    this.instances = {};
    let dashboards = Pipes.getDashboards();
    for ( let key in dashboards ) {
      let id = parseInt(key);
      this.instances[id] = new Dashboard(id, dashboards[key].name);
    }
    //no longer depend on data after this call
  }

  private constructor(readonly id: number, readonly name: string) { }
};

export default Dashboard;