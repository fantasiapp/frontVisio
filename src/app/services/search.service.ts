import { Injectable } from '@angular/core';

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

  static OPENMENU = {}; //used as a token

  INTEGER = /[0-9]+/g;

  levels: [any, string][] = [
    [SearchService.ruleFromRegexp(/Fran?c?e?/i), 'France'],
    [SearchService.ruleFromRegexp(/Nati?o?n?a?l?/i), 'National'],
    [SearchService.ruleFromRegexp(/R[ée]g?i?o?n?/i), 'Région'],
    [SearchService.ruleFromRegexp(/Age?n?t?/i), 'Agent'],
    [SearchService.ruleFromRegexp(/D[ée]pa?r?t?e?m?e?n?t?/i), 'Département'],
    [SearchService.ruleFromRegexp(/Bass?i?n?/i), 'Bassin']
  ];

  addLevel(index: number, rule: any, autocompletion: string) {
    this.levels.splice(index, 0, [rule, autocompletion]);
  }

  constructor() { }

  search(term: string): [string, string, any][] {
    return this.basicSearch(term);
  }

  basicSearch(term: string): [string, string, any][] {
    let int = term.match(this.INTEGER);
    if ( !int ) 
      return this.levelSearch(term, SearchService.OPENMENU);
    return this.levelSearch(term.replace(this.INTEGER, ''), parseInt(int[0]));
  }

  levelSearch(term: string, type: any): [string, string, any][] {
    let results: [string, string, any][] = [];
    for ( let level of this.levels ) {
      let rule = level[0],
        match = rule(term),
        autocompletion = level[1];
      
      if ( !match ) continue;
      results.push([
        autocompletion.slice(0, match.length), autocompletion.slice(match.length), type
      ]);
    }

    console.log(results);
    return results;
  }
}