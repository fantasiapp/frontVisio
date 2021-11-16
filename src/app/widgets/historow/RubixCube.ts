import DEH from "src/app/middle/DataExtractionHelper";
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

  constructor(private historow: HistoRowComponent) {
    RubixCube.initializeDescriptionMock();
    let properties = historow.properties;
    properties.description = RubixCube.DESCRIPTION_MOCK;
    if ( !Array.isArray(properties.arguments[0]) ) { //enseigne
      properties.arguments[0] = [properties.arguments[0], 'ensemble'];
    }
    this.mainAxis = properties.arguments[0][0];
    this.historow.makeSelect();
  }

  set segmentAxis(value: any) {
    this._segmentAxis = value;
    let description = this.historow.properties.description =
      RubixCube.DESCRIPTION_MOCK.filter((_, idx) => this._segmentAxis![idx]);

    if ( description.length == 2 ) {
      this.historow.properties.description.shift();
      this.segmentCondition = 1;
    }
    this.historow.makeSelect();
  }

  get segmentAxis() {
    return this._segmentAxis;
  }

  private segmentStack: boolean[] = [];

  set enseigneCondition(index: number) { //defines segmentAxis
    if ( this._conditions[1] && this._conditions[1].length ) {
      this.mainAxis = this.historow.properties.arguments[0][0];
      this._conditions[1] = null;
      this.segmentAxis = this.segmentStack;
    } else {
      this._conditions[1] = [this.mainAxis, [ +this.cube!.enseigneIndexes[index] ]];
      this.mainAxis = this.historow.properties.arguments[0][1];
      this.segmentStack = this.segmentAxis;
      this.segmentAxis = this.cube!.boolMatrix[index+1];
    }
  }

  set segmentCondition(index: number) {
    index = this.transformSegmentIndex(index);
    this._conditions[0] =  RubixCube.DESCRIPTION_MOCK[index][1][0];
  }

  get conditions() {
    let conditions = this._conditions.filter(x => !!x).reduce((acc: Condition[][], lst) => acc.concat([lst]), []);
    return conditions;
  }

  set rules(cube: CubeData) {
    this.cube = cube;
    this._conditions[1] = null;
    this.segmentStack = [];
    this.segmentAxis = this.cube!.boolMatrix[0]; //render Axis
    if ( this.segmentAxis[0] ) this.segmentCondition = 0;
  }

  transformSegmentIndex(index: number) {
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

  static initializeDescriptionMock() {
    let segmentMarketing = DEH.get('segmentMarketing');
    return this.DESCRIPTION_MOCK = [
      ['Tous segments', []],
      ['Purs Spécialistes', [['segmentMarketing', [+DEH.getKeyByValue(segmentMarketing, 'Purs Spécialistes')!]]]],
      ['Multi Spécialistes', [['segmentMarketing', [+DEH.getKeyByValue(segmentMarketing, 'Multi Spécialistes')!]]]],
      ['Généralistes', [['segmentMarketing', [+DEH.getKeyByValue(segmentMarketing, 'Généralistes')!]]]],
      ['Autres', [['segmentMarketing', [+DEH.getKeyByValue(segmentMarketing, 'Autres')!]]]]
    ]
  }


  static DESCRIPTION_MOCK: [string, Condition[]][] = [];
}