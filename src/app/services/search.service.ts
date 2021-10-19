import { Injectable } from '@angular/core';
import DataExtractionHelper from '../middle/DataExtractionHelper';
import { Node } from '../middle/Node';
import { PDV } from '../middle/Slice&Dice';

export type Suggestion = [string, string, any];
type MatchFunction = (term: string) => string | null;
type SearchFunction = (term: string, ...args: any[]) => Suggestion[];

type FilterMapFunction<U, V> = (t: U) => V | null;

function filterMap<U, V = U>(array: U[], filterMap: FilterMapFunction<U, V>): V[] {
  return array.map(filterMap).filter(x => x) as unknown as V[];
}

function searchDépartement(_: any): SearchFunction {
  let fieldName = SearchService.findFieldName('Département'),
    height = SearchService.findFieldHeight('Département');
  
  return (term: string) => {
    let relevantNodes = PDV.geoTree.getNodesAtHeight(height) as Node[];
    relevantNodes = relevantNodes.filter(node => node.name.search(term) >= 0);

    let result = filterMap<Node, Suggestion>(relevantNodes, (node: Node) => {
      let index = node.name.search(term); //only numbers, doesnt matter here
      if ( index < 0 ) return null;
      let data = {info: node.parent ? node.parent.name : 'racine', geoTree: true, node: node};
      return !index ?
        ['Département ' + term, node.name.slice(term.length), data] :
        ['Département ', node.name, data]
    });

    return result.sort((a, b) =>  b[0].length - a[0].length); //closest to match
  }
};

@Injectable({
  providedIn: 'root'
})
export class SearchService {

  static findFieldName(pretty: string) {
    //try in geo tree and then in trade tree
    for ( let level of DataExtractionHelper.geoLevels )
      if ( level[DataExtractionHelper.PRETTY_INDEX] == pretty )
        return level[DataExtractionHelper.LABEL_INDEX];
    
    for ( let level of DataExtractionHelper.tradeLevels )
      if ( level[DataExtractionHelper.PRETTY_INDEX] == pretty )
        return level[DataExtractionHelper.LABEL_INDEX];
    
    throw 'No data to search ' + pretty;
  }

  static findFieldHeight(pretty: string) {
    //try in geo tree and then in trade tree
    let levels = DataExtractionHelper.geoLevels;
    for ( let i = 0; i < DataExtractionHelper.geoHeight; i++ )
      if ( levels[i][DataExtractionHelper.PRETTY_INDEX] == pretty )
        return i;
    
    levels = DataExtractionHelper.tradeLevels;
    for ( let i = 0; i < DataExtractionHelper.geoHeight; i++ )
      if ( levels[i][DataExtractionHelper.PRETTY_INDEX] == pretty )
        return i;
    
    throw 'No data to search ' + pretty;
  }

  static ruleFromRegexp(regexp: RegExp): MatchFunction {
    return (term: string) => {
      let match = term.match(regexp);
      return match ? match[0] : null;
    }
  }

  static genericRuleMatch(match: string, complete: string): [string, string, any] {
    return [match, complete, null];
  }

  static interpretMatch(level: any): SearchFunction {
    let match = level[3];
    if ( !match ) {
      let fieldName = SearchService.findFieldName(level[1]),
        height = SearchService.findFieldHeight(level[1]);
      
      return (term: string, notEmpty: boolean = true) => {
        if ( !term && notEmpty ) return [];
        let relevantNodes = ((level[2] & this.IS_GEO) ? PDV.geoTree : PDV.tradeTree).getNodesAtHeight(height) as Node[];
        relevantNodes = relevantNodes.filter(node => node.name.toLowerCase().search(term.toLowerCase()) >= 0);
        let result = filterMap<Node, Suggestion>(relevantNodes, (node: Node) => {
          let index = node.name.toLowerCase().search(term.toLowerCase());
          if ( index < 0 ) return null;
          let data = {info: '', geoTree: (level[2] & this.IS_GEO) ? true : false, node: node};
          return !index ?
            [term, node.name.slice(term.length), data] :
            ['', node.name, data]
        });
    
        return result.sort((a, b) =>  b[0].length - a[0].length); //closest to match
      }
    } else {
      return match();
    }
  }

  static OPENMENU = {}; //used as a token

  INTEGER = /[0-9]+/g;

  levels: [MatchFunction, string, number, any?][] = [
    [SearchService.ruleFromRegexp(/Nat?i?o?n?a?l?/i), 'National', SearchService.IS_REDIRECTION, SearchService.genericRuleMatch],
    [SearchService.ruleFromRegexp(/R[ée]g?i?o?n?/i), 'Région', SearchService.IS_PATTERN | SearchService.IS_GEO],
    [SearchService.ruleFromRegexp(/(?:Sec?t?e?u?r?)|(?:Age?n?t?)/i), 'Secteur', SearchService.IS_PATTERN | SearchService.IS_GEO],
    [SearchService.ruleFromRegexp(/D[ée]p?a?r?t?e?m?e?n?t?/i), 'Département', SearchService.IS_PATTERN | SearchService.IS_GEO, searchDépartement],
    [SearchService.ruleFromRegexp(/Bas?s?i?n?/i), 'Bassin', SearchService.IS_PATTERN | SearchService.IS_GEO],
    [SearchService.ruleFromRegexp(/Ens?e?i?g?n?e?/i), 'Enseigne', SearchService.IS_PATTERN]
  ];

  addLevel(index: number, rule: any, autocompletion: string, type: number, onmatch: SearchFunction) {
    this.levels.splice(index, 0, [rule, autocompletion, type, onmatch]);
  }

  static FIND_PATTERN = 0;
  static FIND_INSTANCE = 1;

  static IS_PATTERN = 1;
  static IS_REDIRECTION = 2;
  static IS_GEO = 4;

  private mode: number = SearchService.FIND_PATTERN;
  private customSearch: SearchFunction | null = null;

  switchMode(mode: number, pattern: string = '') {
    if ( pattern == '' || mode == SearchService.FIND_PATTERN ) { this.mode = SearchService.FIND_PATTERN; return true; }
    
    let level = this.levels.find(level => level[1] == pattern);
    if ( !level ) return false;
    this.customSearch = SearchService.interpretMatch(level);
    this.mode = mode;
    return true;
  }

  constructor() { }

  search(term: string, ...args: any[]): Suggestion[] {
    let result = this.mode == SearchService.FIND_PATTERN ?
      this.patternSearch(term) : this.instanceSearch(term, ...args);
    
    return result;
  }

  patternSearch(term: string): Suggestion[] {
    return this.levelSearch(term.replace(this.INTEGER, ''));
  }

  instanceSearch(term: string, ...args: any[]): Suggestion[] {
    return this.customSearch!(term, ...args);
  }

  findAll() {
    let result = this.mode == SearchService.FIND_PATTERN ?
      this.findAllPatterns() : this.findAllInstances();
    return result;
  }

  findAllPatterns(): Suggestion[] {
    return this.levels.map(level => 
      ['', level[1], level[2]]
    )
  }

  findAllInstances(): Suggestion[] {
    return this.customSearch!('', false);
  }

  levelSearch(term: string): Suggestion[] {
    let results: Suggestion[] = [];
    for ( let i = 0; i < this.levels.length; i++ ) {
      let level = this.levels[i],
        rule = level[0],
        match = rule(term),
        autocompletion = level[1];
      
      if ( !match ) continue;
      
      let typed = autocompletion.slice(0, match.length),
        completed = autocompletion.slice(match.length);
      
      results.push([typed, completed, level[2]]);
    }
    return results.sort((a, b) =>  b[0].length - a[0].length);
  }

  static canvas = document.createElement('canvas');
  static ctx = SearchService.canvas.getContext('2d');
  static measureText(text: string, font: string) {
    this.ctx!.font = font;
    return this.ctx!.measureText(text).width;
  }
}