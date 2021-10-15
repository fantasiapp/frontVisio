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
  private segmentAxis: boolean[] = [];
  private enseigneAxis: boolean[] | null =  null;

  constructor(private historow: HistoRowComponent) {
    let properties = historow.properties;
    properties.description = RubixCube.DESCRIPTION_MOCK;
    if ( !Array.isArray(properties.arguments[0]) ) { //enseigne
      properties.arguments[0] = [properties.arguments[0], 'ensemble'];
    }

    this.mainAxis = properties.arguments[0][0];
  }

  set enseigneCondition(index: number) {
    if ( this._conditions[1] && this._conditions[1].length ) {
      this.mainAxis = this.historow.properties.arguments[0][0];
      this._conditions[1] = null;
    } else {
      this._conditions[1] = [this.mainAxis, [this.transformIndex(index, 0)]];
      this.mainAxis = this.historow.properties.arguments[0][1];
      if ( !this.enseigneAxis![index] )
        this.segmentCondition = 0;
    }
  }

  set segmentCondition(index: number) {
    index = this.transformIndex(index, 1);
    this.enseigneAxis = this.cube!.boolMatrix.map(row => row[index]);
    console.log(this.enseigneAxis);
    this._conditions[0] = RubixCube.DESCRIPTION_MOCK[index][1][0];
  }

  get conditions() {
    let conditions = this._conditions.filter(x => !!x).reduce((acc: Condition[][], lst) => acc.concat([lst]), []);
    return conditions;
  }

  set rules(cube: CubeData) {
    console.log(cube);
    this.cube = cube;
    this.segmentAxis = cube.boolMatrix[0].slice(0, RubixCube.DESCRIPTION_MOCK.length);
    this.enseigneAxis = cube.boolMatrix.map(row => row[0]).slice(1);
    this.historow.properties.description = RubixCube.DESCRIPTION_MOCK.filter((_, idx) => this.segmentAxis[idx]);
  }

  transformIndex(index: number, axis: number) {
    let _idx = index;
    if ( axis == 1 ) {
      let pos = 0;
      while ( index-- >= 0 ) {
        while ( pos < this.segmentAxis.length && !this.segmentAxis[pos] ) {
          pos++;
        }
        pos += 1;
      }

      return pos - 1; //use indices from the array to eliminate the mock
    } else if ( axis == 0 ) {
      let pos = 0;
      while ( index-- >= 0 ) {
        while ( pos < this.enseigneAxis!.length && !this.enseigneAxis![pos] ) {
          pos++;
        }
        pos += 1;
      }

      console.log('transformIndex', _idx, '=>', pos);
      return +this.cube!.enseigneIndexes[pos-1];
    } else return index;
  }


  static DESCRIPTION_MOCK: [string, Condition[]][] = [
    ['Tous segments', []], ['Purs Spécialistes', [['segmentMarketing', [6]]]], ['Multi Spécialistes', [['segmentMarketing', [7]]]], ['Généralistes', [['segmentMarketing', [8]]]], ['Autres', [['segmentMarketing', [9]]]]
  ];
}