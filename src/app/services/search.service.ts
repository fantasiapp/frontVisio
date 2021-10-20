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

function searchDépartement(): SearchFunction {
  let [height,] = SearchService.findFieldHeight('Département');
  
  return (term: string, notEmpty: boolean = true, sort: boolean = true) => {
    if ( !term && notEmpty ) return [];
    let relevantNodes = PDV.geoTree.getNodesAtHeight(height) as Node[];
    relevantNodes = relevantNodes.filter(node => node.name.search(term) >= 0);

    let result = filterMap<Node, Suggestion>(relevantNodes, (node: Node) => {
      let index = node.name.search(term);
      if ( index < 0 ) return null;
      let data = {info: node.parent ? node.parent.name : 'racine', geoTree: true, node: node};
      return !index ?
        ['Département ' + term, node.name.slice(term.length), data] :
        ['Département ', node.name, data]
    });

    return sort ? result.sort((a, b) =>  b[0].length - a[0].length) : result;
  }
};

function searchField(field: string): SearchFunction {
  if ( field == 'Département' )
    return searchDépartement();
  
  let [fieldName, isGeo] = SearchService.findFieldName(field),
    [height,] = SearchService.findFieldHeight(field);
    
  return (term: string, notEmpty: boolean = true, sort: boolean = true) => {
    if ( !term && notEmpty ) return [];
    let relevantNodes = (isGeo ? PDV.geoTree : PDV.tradeTree).getNodesAtHeight(height) as Node[];
    relevantNodes = relevantNodes.filter(node => node.name.toLowerCase().search(term.toLowerCase()) >= 0);
    let result = filterMap<Node, Suggestion>(relevantNodes, (node: Node) => {
      let index = node.name.toLowerCase().search(term.toLowerCase());
      if ( index < 0 ) return null;
      let data = {info: '', geoTree: isGeo, node: node};
      return !index ?
        [term, node.name.slice(term.length), data] :
        ['', node.name, data]
    });

    return sort ? result.sort((a, b) =>  b[0].length - a[0].length) : result;
  }
};

function searchDashboard(hightlight: boolean = false): SearchFunction {
  let dashboards = Object.entries<any>(DataExtractionHelper.get('dashboards'));
  return (term: string, notEmpty: boolean = true, sort: boolean = true) => {
    if ( !term && notEmpty ) return [];
    let result: Suggestion[] = [];
    for ( let [id, name] of dashboards ) {
      name = name[0];
      let index = name.toLowerCase().search(term.toLowerCase());
      if ( index < 0 ) continue;
      let data = {info: hightlight ? 'Tableau' : '', dashboard: id};
      result.push(!index ?
        [term, name.slice(term.length), data] :
        ['', name, data])
    }
    return sort ? result.sort((a, b) =>  b[0].length - a[0].length) : result;
  }
};

function searchAll(...fields: string[]): SearchFunction {
  let functions: SearchFunction[] = fields.map(field => searchField(field));
  return (term: string, notEmpty: boolean = true, sort: boolean = true) => {
    let result: Suggestion[] = [];
    for ( let i = 0; i < fields.length; i++ ) {
      let field = fields[i],
        partial = functions[i](term, notEmpty);
      partial.forEach(suggestion => { if ( !suggestion[2].info ) suggestion[2].info = field});
      Array.prototype.push.apply(result, partial);
    }
    return sort ? result.sort((a, b) =>  b[0].length - a[0].length) : result;
  };
};

function combineResults(functions: SearchFunction[], notEmpty: boolean = true, sort: boolean = true) {
  return (term: string) => {
    let result = functions.map(f => f(term, notEmpty)).flat();
    return sort ? result.sort((a, b) =>  b[0].length - a[0].length) : result
  }
};

@Injectable({
  providedIn: 'root'
})
export class SearchService {

  static findFieldName(pretty: string): [string, boolean] {
    //try in geo tree and then in trade tree, true is for geotree
    for ( let level of DataExtractionHelper.geoLevels )
      if ( level[DataExtractionHelper.PRETTY_INDEX] == pretty )
        return [level[DataExtractionHelper.LABEL_INDEX], true];
    
    for ( let level of DataExtractionHelper.tradeLevels )
      if ( level[DataExtractionHelper.PRETTY_INDEX] == pretty )
        return [level[DataExtractionHelper.LABEL_INDEX], false];
    
    throw 'No data to search ' + pretty;
  }

  static findFieldHeight(pretty: string): [number, boolean] {
    //try in geo tree and then in trade tree
    let levels = DataExtractionHelper.geoLevels;
    for ( let i = 0; i < DataExtractionHelper.geoHeight; i++ )
      if ( levels[i][DataExtractionHelper.PRETTY_INDEX] == pretty )
        return [i, true];
    
    levels = DataExtractionHelper.tradeLevels;
    for ( let i = 0; i < DataExtractionHelper.geoHeight; i++ )
      if ( levels[i][DataExtractionHelper.PRETTY_INDEX] == pretty )
        return [i, false];
    
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
      return searchField(level[1]);
    } else {
      return match();
    }
  }

  levels: [MatchFunction, string, number, any?][] = [
    [SearchService.ruleFromRegexp(/Tou?s?/i), 'Tous', SearchService.IS_PATTERN, () => combineResults([searchAll('Région', 'Secteur', 'Département', 'Bassin', 'Enseigne', 'Ensemble', 'Sous-Ensemble'), searchDashboard(true)])],
    [SearchService.ruleFromRegexp(/(?:Nat?i?o?n?a?l?)|(?:Fra?n?c?e?)/i), 'National', SearchService.IS_REDIRECTION],
    [SearchService.ruleFromRegexp(/R[ée]g?i?o?n?/i), 'Région', SearchService.IS_PATTERN],
    [SearchService.ruleFromRegexp(/(?:Sec?t?e?u?r?)|(?:Age?n?t?)/i), 'Secteur', SearchService.IS_PATTERN],
    [SearchService.ruleFromRegexp(/D[ée]p?a?r?t?e?m?e?n?t?/i), 'Département', SearchService.IS_PATTERN, searchDépartement],
    [SearchService.ruleFromRegexp(/Bas?s?i?n?/i), 'Bassin', SearchService.IS_PATTERN],
    [SearchService.ruleFromRegexp(/Ens?e?i?g?n?e?/i), 'Enseigne', SearchService.IS_PATTERN],
    [SearchService.ruleFromRegexp(/(?:Bord?)|(?:Table?a?u?x?)/i), 'Tableaux de bords', SearchService.IS_PATTERN, searchDashboard]
  ];

  addLevel(index: number, rule: any, autocompletion: string, type: number, onmatch: SearchFunction) {
    this.levels.splice(index, 0, [rule, autocompletion, type, onmatch]);
  }

  static FIND_PATTERN = 0;
  static FIND_INSTANCE = 1;

  static IS_PATTERN = 1;
  static IS_REDIRECTION = 2;

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

  constructor() {
    (window as any).search = searchDashboard;
  }

  search(term: string, ...args: any[]): Suggestion[] {
    let result = this.mode == SearchService.FIND_PATTERN ?
      this.patternSearch(term) : this.instanceSearch(term, ...args);
    
    return result;
  }

  patternSearch(term: string): Suggestion[] {
    return this.levelSearch(term);
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