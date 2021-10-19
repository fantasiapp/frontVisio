import { Injectable } from '@angular/core';

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
  };

  static KEEP_VIEW = 0;
  static GEO_VIEW = 1;
  static TRADE_VIEW = 2;

  static genericRuleMatch(match: string, complete: string): [string, string, any] {
    return [match, complete, SearchService.OPENMENU];
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

  constructor() { }

  search(term: string): [string, string, any][] {
    return this.basicSearch(term);
  }

  basicSearch(term: string): [string, string, any][] {
    return this.levelSearch(term.replace(this.INTEGER, ''));
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
      
      results.push(level[2](typed, completed));
    }
    return results;
  }
}