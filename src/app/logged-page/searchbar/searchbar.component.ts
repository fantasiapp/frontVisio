import { ChangeDetectionStrategy, Component, ElementRef, EventEmitter, HostBinding, HostListener, OnDestroy, Output, ViewChild } from '@angular/core';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { FiltersStatesService } from 'src/app/filters/filters-states.service';
import { SubscriptionManager } from 'src/app/interfaces/Common';
import { Navigation } from 'src/app/middle/Navigation';
import { PDV } from 'src/app/middle/Slice&Dice';
import {  Result, SearchService, Suggestion } from 'src/app/services/search.service';
import { PatternPipe } from './pattern.pipe';
import { SuggestionBox } from './suggestionbox/suggestionbox.component';

@Component({
  selector: 'searchbar',
  templateUrl: './searchbar.component.html',
  styleUrls: ['./searchbar.component.css'],
  providers: [SearchService],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SearchbarComponent extends SubscriptionManager {
  @ViewChild('input', {static: true, read: ElementRef})
  input?: ElementRef;

  @ViewChild('suggestionbox', {read: SuggestionBox})
  suggestionBox?: SuggestionBox;
  
  @HostBinding('class.opened')
  opened: boolean = false;

  @Output()
  PDVfound: EventEmitter<PDV> = new EventEmitter;

  term: Subject<string> = new Subject();
  lastTerm: string = '';
  results: Subject<Suggestion[]> = new Subject;
  lastResults: Suggestion[] = [];

  private _pattern: string = '';
  get pattern() { return this._pattern; }
  set pattern(value: string) {
    let switched =
      this.engine.switchMode(value ? SearchService.FIND_INSTANCE : SearchService.FIND_PATTERN, value);
    if ( !switched ) return;
    this._pattern = value;
    this.results.next(this.lastResults = []);
    this.input!.nativeElement.value = '';
    this.selectionIndex = 0;
  }

  private debounceDuration = 60;
  get placeholder(): string {
    if ( !this.pattern ) return 'Sélectionnez une catégorie';
    return 'Rechercher dans ' + this.pattern;
  }

  get patternWidth(): number {
    if ( !this.pattern ) return 0;
    return SearchService.measureText(PatternPipe.transform(this.pattern), '14px Roboto')
  }

  constructor(private ref: ElementRef, private engine: SearchService, private navigation: Navigation, private filtersState: FiltersStatesService) {
    super();
    this.subscribe(this.term.pipe(debounceTime(this.debounceDuration)), term => {
      let results = this.engine.search(this.lastTerm = term);
      this.results.next(this.lastResults = results);
    });

    if ( this.pattern )
      this.engine.switchMode(SearchService.FIND_INSTANCE, this.pattern);
  }

  onInput(e: Event) {
    let target = e.target,
      value = (target as any).value;
    
    this.selectionIndex = 0;
    this.term.next(value.trim());
  }

  onFocus(e: Event) {
    if ( this.pattern )
      this.results.next(this.lastResults = this.engine.search(this.lastTerm));
    else
      this.showAllSuggestions();
  }

  //Doesn't work like i wish it to be
  @HostListener('focusout', ['$event'])
  private onFocusOut(e: MouseEvent) {
    setTimeout(() => {
      this.term.next(this.input!.nativeElement.value = this.lastTerm = '');
    }, 150);
  }

  selectionIndex: number = -1;
  onKeyDown(e: KeyboardEvent) {
    if ( e.code == 'ArrowDown' ) {
      e.preventDefault();
      this.selectionIndex = Math.min(this.selectionIndex+1, this.lastResults.length-1);
    }

    if ( e.code == 'ArrowUp' ) {
      e.preventDefault();
      this.selectionIndex = Math.max(0, this.selectionIndex - 1);
    }

    if ( e.code == 'Tab' || e.code == 'Enter' ) {
      e.preventDefault();
      let suggestion = this.lastResults[this.selectionIndex] || this.lastResults[0];
      if ( !suggestion && e.code == 'Enter' ) return;
      this.onSelectionConfirmed(suggestion);
    }

    if ( e.code == 'Escape' ) {
      e.preventDefault();
      if ( this.pattern ) {
        this.pattern = '';
        this.results.next(this.lastResults = []);
      } else this.pattern = 'Tous';
    }

    if ( e.code == 'Space' && e.ctrlKey ) {
      this.showAllSuggestions();
    }
  }

  onSelectionConfirmed(suggestion?: Suggestion) {
    if ( !suggestion ) {
      this.filtersState.reset(this.filtersState.navigation.tree!, false);
      //this.pattern = '';
      return;
    };

    if ( !this.pattern ) {
      let type = suggestion[2] as number;
      if ( type == SearchService.IS_REDIRECTION ) {
        this.filtersState.reset(this.filtersState.navigation.tree!, false);
        this.pattern = '';
      } else {
        this.pattern = suggestion[0] + suggestion[1];
      }
    } else {
      let data = suggestion[2] as Result;
      if ( data.node ) {
        this.navigation.setNode(data.geoTree ? PDV.geoTree : PDV.tradeTree, data.node);
        this.filtersState.refresh();
      } else if ( data.dashboard ) {
        this.navigation.setDashboard(data.geoTree ? PDV.geoTree : PDV.tradeTree, data.dashboard)
        this.filtersState.refresh();
      } else if ( data.pdv ) {
        this.PDVfound.emit(data.pdv);
      }
      else { return console.error("invalid research result"); }
    }

    this.lastTerm = this.input!.nativeElement.value = '';
    this.results.next(this.lastResults = []);
  }

  showAllSuggestions() {
    this.results.next(this.lastResults = (this.lastTerm ? this.engine.search(this.lastTerm) : this.engine.findAll()));
  }

  close() {
    this.opened = !this.opened;
    this.pattern = '';
    if ( this.input ) this.lastTerm = this.input.nativeElement.value = '';
    this.results.next(this.lastResults = []);
  }
}