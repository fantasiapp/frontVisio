import { Injectable } from '@angular/core';
import Dashboard from '../middle/Dashboard';
import DEH from '../middle/DataExtractionHelper';
import { Node } from '../middle/Node';
import { PDV } from '../middle/Pdv';
import { filterMap, SubscriptionManager } from '../interfaces/Common';
import { DataService } from './data.service';

type MatchFunction = (term: string) => string | null;
type SearchFunction = (term: string, ...args: any[]) => Suggestion[];

export type Result = {info?: string; node?: Node; dashboard?: Dashboard; pdv?: PDV; geoTree?: boolean};
export type LevelSuggestion = [string, string, number];
export type PatternSuggestion = [string, string, Result];
export type Suggestion = LevelSuggestion | PatternSuggestion;

function searchPDV(): SearchFunction {
  let pdvs = [...PDV.getInstances().values()];
  return (term: string, showAll: boolean = true, sort: boolean = true) => {
    if ( !term && showAll ) return [];
    term = term.toLowerCase();
    let result = filterMap<PDV, Suggestion>(pdvs, (pdv: PDV) => {
      let name = pdv.name.toLowerCase(),
        index = name.indexOf(term);
      
      if ( index < 0 ) return null;
      let data = {pdv};
      return !index ?
        [name.slice(0, term.length), name.slice(term.length), data] : 
        ['', name, data];
    });
    return result;
  };
};

function searchDashboard(): SearchFunction {
  let dashboards = Object.entries<any>(DEH.get('dashboards')),
    geoDashboards = PDV.geoTree.getAllDashboards(),
    ids = geoDashboards.map(d => d.id);
  
    return (term: string, showAll: boolean = true, sort: boolean = true) => {
    if ( !term && showAll ) return [];
    let result: Suggestion[] = [];
    for ( let [_id, name] of dashboards ) {
      let id = +_id, index, isGeo, dashboard, data;
      name = name[0];
      index = name.toLowerCase().indexOf(term.toLowerCase());
      if ( index < 0 ) continue;
      isGeo = ids.includes(id);
      dashboard = isGeo ? geoDashboards.find(d => d.id == id) : PDV.tradeTree.getAllDashboards().find(d => d.id == id);
      data = {info: isGeo ? 'Org. commercial' : 'Enseigne', geoTree: isGeo, dashboard};
      result.push(!index ?
        [term, name.slice(term.length), data] :
        ['', name, data])
    }
    return sort ? result.sort((a, b) =>  b[0].length - a[0].length) : result;
  }
};

function searchField(field: string): SearchFunction {
  if ( field == 'Département' )
    return searchDépartement();
  if ( field == 'Bassin' )
    return searchBassin();
  if ( field == 'Points de Vente' )
    return searchPDV();
  
  let [_, isGeo] = SearchService.findFieldName(field),
    [height,] = SearchService.findFieldHeight(field);
    
  return (term: string, showAll: boolean = true, sort: boolean = true) => {
    if ( !term && showAll || height < 0 ) return [];
    term = term.toLowerCase();
    let relevantNodes = (isGeo ? PDV.geoTree : PDV.tradeTree).getNodesAtHeight(height) as Node[];
    let result = filterMap<Node, Suggestion>(relevantNodes, (node: Node) => {
      let index = node.name.toLowerCase().indexOf(term);
      if ( index < 0 ) return null;
      let data = {info: '', geoTree: isGeo, node: node};
      return !index ?
        [term, node.name.slice(term.length), data] :
        ['', node.name, data]
    });

    return sort ? result.sort((a, b) =>  b[0].length - a[0].length) : result;
  }
};

//Département names can be duplicates
function searchDépartement(): SearchFunction {
  let [height,] = SearchService.findFieldHeight('Département');
  
  return (term: string, showAll: boolean = true, sort: boolean = true) => {
    if ( !term && showAll || height < 0 ) return [];
    term = term.toLowerCase();
    let relevantNodes = PDV.geoTree.getNodesAtHeight(height) as Node[];

    let result = filterMap<Node, Suggestion>(relevantNodes, (node: Node) => {
      let index = node.name.toLowerCase().indexOf(term);
      if ( index < 0 ) return null;
      let data = {info: node.parent!.name , geoTree: true, node: node};
      return !index ?
        ['Département ' + term, node.name.slice(term.length), data] :
        ['Département ', node.name, data]
    });

    return sort ? result.sort((a, b) =>  b[0].length - a[0].length) : result;
  }
};

//Bassin names can be duplicaltes
function searchBassin(): SearchFunction {
  let [height,] = SearchService.findFieldHeight('Bassin');
  return (term: string, showAll: boolean = true, sort: boolean = true) => {
    if ( !term && showAll || height < 0 ) return [];
    term = term.toLowerCase();
    let relevantNodes = PDV.geoTree.getNodesAtHeight(height) as Node[];

    let result = filterMap<Node, Suggestion>(relevantNodes, (node: Node) => {
      let index = node.name.toLowerCase().indexOf(term);
      if ( index < 0 ) return null;
      let data = {info: node.parent!.parent!.name + ', ' + node.parent!.name, geoTree: true, node: node};
      return !index ?
        [term, node.name.slice(term.length), data] :
        ['', node.name, data]
    });

    return sort ? result.sort((a, b) =>  b[0].length - a[0].length) : result;
  }
};

function searchAll(...fields: string[]): SearchFunction {
  let functions: SearchFunction[] = fields.map(field => searchField(field));
  return (term: string, showAll: boolean = true, sort: boolean = true) => {
    let result: Suggestion[] = [];
    for ( let i = 0; i < fields.length; i++ ) {
      let field = fields[i],
        partial = functions[i](term, showAll, false) as PatternSuggestion[];
      partial.forEach((suggestion) => { if ( !suggestion[2].info ) suggestion[2].info = field });
      Array.prototype.push.apply(result, partial);
    }
    return sort ? result.sort((a, b) =>  b[0].length - a[0].length) : result;
  };
};

function combineResults(functions: SearchFunction[]) {
  return (term: string, showAll: boolean = true, sort: boolean = true) => {
    let result = functions.map(f => f(term, showAll, false)).flat();
    return sort ? result.sort((a, b) =>  b[0].length - a[0].length) : result
  }
};

@Injectable()
export class SearchService extends SubscriptionManager {
  private levels: [MatchFunction, string, number, any?][] = [];
  private mode: number = SearchService.FIND_PATTERN;
  private pattern: string = '';
  private customSearch: SearchFunction | null = null;

  constructor(private dataservice: DataService) {
    super();
    let searchableFields = SearchService.getSearchableFields(),
      treeLevels = [...searchableFields.geoTree, ...searchableFields.tradeTree];
    
    this.levels.push([SearchService.ruleFromSubstring('Tous', 1), 'Tous', SearchService.IS_PATTERN, () => combineResults([searchAll(...treeLevels), searchDashboard()])]);
    this.levels.push([SearchService.ruleFromSubstring('Points de Vente', 3), 'Points de vente', SearchService.IS_PATTERN, searchPDV]);
    this.levels.push([SearchService.ruleFromRegexp(/(?:Bor?d?)|(?:Tabl?e?a?u?x?)/i), 'Tableaux de bords', SearchService.IS_PATTERN, searchDashboard]);
    Array.prototype.push.apply(
      this.levels,
      treeLevels.map(field =>
        [SearchService.ruleFromSubstring(field, 3), field, SearchService.IS_PATTERN]
      )
    );
    
    this.subscribe(dataservice.update, _ => {
      //if we are searching from data, update the search function
      if ( this.mode == SearchService.FIND_INSTANCE )
        this.switchMode(SearchService.FIND_INSTANCE, this.pattern);
    });
  }
  
  addLevel(index: number, rule: any, autocompletion: string, type: number, onmatch: SearchFunction) {
    this.levels.splice(index, 0, [rule, autocompletion, type, onmatch]);
  }

  switchMode(mode: number, pattern: string = '') {
    if ( pattern == '' || mode == SearchService.FIND_PATTERN ) { this.mode = SearchService.FIND_PATTERN; this.pattern = ''; return true; }    
    let level = this.levels.find(level => level[1] == pattern);
    if ( !level ) return false;
    this.customSearch = SearchService.interpretMatch(level);
    this.mode = mode;
    this.pattern = pattern;
    return true;
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

  findAll() {
    let result = this.mode == SearchService.FIND_PATTERN ?
      this.findAllPatterns() : this.findAllInstances();
    return result;
  }

  findAllPatterns(): Suggestion[] {
    return this.levels.map(level => 
      [level[1], '', level[2]]
    )
  }

  findAllInstances(): Suggestion[] {
    return this.customSearch!('', false);
  }

  static findFieldName(pretty: string): [string, boolean] {
    //try in geo tree and then in trade tree, true is for geotree
    for ( let level of DEH.geoLevels )
      if ( level[DEH.PRETTY_INDEX] == pretty )
        return [level[DEH.LABEL_INDEX], true];
    
    for ( let level of DEH.tradeLevels )
      if ( level[DEH.PRETTY_INDEX] == pretty )
        return [level[DEH.LABEL_INDEX], false];
    
    throw `[Searchbar: no field called ${pretty}]`;
  }

  static findFieldHeight(pretty: string): [number, boolean] {
    //try in geo tree and then in trade tree
    let levels = DEH.geoLevels;
    for ( let i = 0; i < DEH.geoHeight; i++ )
      if ( levels[i][DEH.PRETTY_INDEX] == pretty )
        return [i, true];
    
    levels = DEH.tradeLevels;
    for ( let i = 0; i < DEH.geoHeight; i++ )
      if ( levels[i][DEH.PRETTY_INDEX] == pretty )
        return [i, false];
    
    throw `[Searchbar: no field called ${pretty}]`;
  }

  static ruleFromRegexp(regexp: RegExp): MatchFunction {
    return (term: string) => {
      let match = term.match(regexp);
      return match ? match[0] : null;
    }
  }

  static ruleFromSubstring(str: string, p: number = 3): MatchFunction {
    str = str.toLowerCase();
    return (term: string) => {
      let count = 0, m = Math.min(str.length, term.length),
        _term = term.toLowerCase();
      
      while ( count < m && str[count] == _term[count] )
        count++;
      
      if ( count >= p ) return term.slice(0, count);
      return null;
    }
  }

  static interpretMatch(level: any): SearchFunction {
    let match = level[3];
    return match ? match() : searchField(level[1]);
  }

  static getSearchableFields() {
    //skip first level: France and last one: PDV
    return {
      geoTree: PDV.geoTree.labels.slice(1, -1),
      tradeTree: PDV.tradeTree.labels.slice(1, -1),
      PDVs: 'Points de vente',
      dashboards: 'Tableaux de bords'
    };
  }

  ngOnDestroy() {
    super.ngOnDestroy();
    console.log('destrouyyyying');
  }

  // Modes
  static FIND_PATTERN = 0;
  static FIND_INSTANCE = 1;

  // Type of category
  static IS_PATTERN = 1;
  static IS_REDIRECTION = 2;

  // Text measurements
  static canvas = document.createElement('canvas');
  static ctx = SearchService.canvas.getContext('2d')!;
  static measureText(text: string, font: string) {
    this.ctx.font = font;
    return this.ctx.measureText(text).width;
  }
}