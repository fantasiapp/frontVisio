import { Injectable } from '@angular/core';
import DataExtractionHelper from '../middle/DataExtractionHelper';

type onMatch = (match: string, complete: string) => [string, string, any];

@Injectable({
  providedIn: 'root'
})
export class SearchService {

  static ruleFromRegexp(regexp: RegExp) {
    return (term: string) => {
      let match = term.match(regexp);
      return match ? match[0] : null;
    }
  }

  static genericRuleMatch(match: string, complete: string): [string, string, any] {
    return [match, complete, SearchService.OPENMENU];
  }

  static interpretMatch(match: any) {
    if ( typeof match == 'string' ) {
      let fields = DataExtractionHelper.get(match);
      return (term: string) => {
        let result = [];
        for ( let field of fields )
          if ( field.search(term) !== -1 )
            result.push([term, field.slice(term.length), '']);
        return result;
      }
    } else {
      return match;
    }
  }

  static OPENMENU = {}; //used as a token

  INTEGER = /[0-9]+/g;

  levels: [any, string, onMatch][] = [
    [SearchService.ruleFromRegexp(/Fran?c?e?/i), 'France', SearchService.genericRuleMatch],
    [SearchService.ruleFromRegexp(/Nati?o?n?a?l?/i), 'National', SearchService.genericRuleMatch],
    [SearchService.ruleFromRegexp(/R[ée]g?i?o?n?/i), 'Région', SearchService.genericRuleMatch],
    [SearchService.ruleFromRegexp(/Age?n?t?/i), 'Agent', SearchService.genericRuleMatch],
    [SearchService.ruleFromRegexp(/D[ée]pa?r?t?e?m?e?n?t?/i), 'Département', SearchService.genericRuleMatch],
    [SearchService.ruleFromRegexp(/Bass?i?n?/i), 'Bassin', SearchService.genericRuleMatch]
  ];

  addLevel(index: number, rule: any, autocompletion: string, onmatch: any = SearchService.genericRuleMatch) {
    this.levels.splice(index, 0, [rule, autocompletion, onmatch]);
  }

  static FIND_PATTERN = 0;
  static FIND_INSTANCE = 1;

  static IS_PATTERN = 0;
  static IS_NAVIGATED = 1;

  private mode: number = SearchService.FIND_PATTERN;
  private pattern: string = '';

  switchMode(mode: number, pattern: string = '') {
    this.mode = mode;
    this.pattern = pattern;
  }

  constructor() { }

  search(term: string): [string, string, any][] {
    let result = this.mode == SearchService.FIND_PATTERN ?
      this.patternSearch(term) : this.instanceSearch(term);
    
    return result;
  }

  patternSearch(term: string): [string, string, any][] {
    return this.levelSearch(term.replace(this.INTEGER, ''));
  }

  instanceSearch(term: string): [string, string, any][] {
    return [
      ['Casca', 'les', '']
    ]
  }

  levelSearch(term: string): [string, string, any][] {
    let results: [string, string, any][] = [];
    for ( let i = 0; i < this.levels.length; i++ ) {
      let level = this.levels[i],
        rule = level[0],
        match = rule(term),
        autocompletion = level[1];
      
      if ( !match ) continue;
      
      let typed = autocompletion.slice(0, match.length),
        completed = autocompletion.slice(match.length);
      
      results.push([typed, completed, SearchService.OPENMENU]);
    }
    return results;
  }

  static canvas = document.createElement('canvas');
  static ctx = SearchService.canvas.getContext('2d');
  static measureText(text: string, font: string) {
    this.ctx!.font = font;
    console.log(this.ctx!.measureText(text).width);
    return this.ctx!.measureText(text).width;
  }
}