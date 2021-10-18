import { HistoRowComponent } from "./historow.component";

type CubeData = {
  boolMatrix: boolean[][];
  enseigneIndexes: number[];
  segmentMarketingIndexes: number[];
};

type Condition = [string, number[]] | [] | null;

export class RubixCube {

  mainAxis: string;
  private _conditions: [Condition, Condition] = [null, null];
  private cube?: CubeData;
  private _segmentAxis: boolean[] | null = null;

  private lastSegmentAxis: boolean[] | null = null;


  constructor(private historow: HistoRowComponent) {
    let properties = historow.properties;
    properties.description = RubixCube.DESCRIPTION_MOCK;
    if ( !Array.isArray(properties.arguments[0]) ) { //enseigne
      properties.arguments[0] = [properties.arguments[0], 'ensemble'];
    }

    this.mainAxis = properties.arguments[0][0];
  }

  set segmentAxis(value: any) {
    this._segmentAxis = value;
    this.historow.properties.description = RubixCube.DESCRIPTION_MOCK.filter((_, idx) => this.segmentAxis![idx]);
    this.historow.makeSelect();
  }

  get segmentAxis() {
    return this._segmentAxis;
  }

  set enseigneCondition(index: number) { //defines segmentAxis
    if ( this._conditions[1] && this._conditions[1].length ) {
      this.mainAxis = this.historow.properties.arguments[0][0];
      this._conditions[1] = null;
      this.segmentAxis = this.lastSegmentAxis;
    } else {
      this._conditions[1] = [this.mainAxis, [ +this.cube!.enseigneIndexes[index] ]];
      this.mainAxis = this.historow.properties.arguments[0][1];
      this.lastSegmentAxis = this.segmentAxis;
      this.segmentAxis = this.cube!.boolMatrix[index+1];
    }
  }

  set segmentCondition(index: number) {
    index = this.transformIndex(index);
    this._conditions[0] =  RubixCube.DESCRIPTION_MOCK[index][1][0];
  }

  get conditions() {
    let conditions = this._conditions.filter(x => !!x).reduce((acc: Condition[][], lst) => acc.concat([lst]), []);
    return conditions;
  }

  set rules(cube: CubeData) {
    this.cube = cube;
    this._conditions[1] = null;
    this.lastSegmentAxis = null;
    this.segmentAxis = this.cube!.boolMatrix[0]; //render Axis
    this.segmentCondition = 0; //add condition to the displayer
  }

  transformIndex(index: number) {
    let pos = 0;
    while ( pos < this.segmentAxis!.length ) {
      if ( this.segmentAxis![pos++] ) index--;
      if ( index == -1 ) {
        return pos-1;
      }
    }
    throw "incorrect value";
  }

  getIndexById(id: number) {
    return this.cube!.enseigneIndexes.findIndex(x => +x == id);
  }


  static DESCRIPTION_MOCK: [string, Condition[]][] = [
    ['Tous segments', []], ['Purs Spécialistes', [['segmentMarketing', [6]]]], ['Multi Spécialistes', [['segmentMarketing', [7]]]], ['Généralistes', [['segmentMarketing', [8]]]], ['Autres', [['segmentMarketing', [9]]]]
  ];
}