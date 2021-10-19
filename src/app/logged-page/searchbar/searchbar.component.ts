import { ChangeDetectionStrategy, Component, ElementRef, HostListener, OnDestroy, ViewChild } from '@angular/core';
import { Subject, Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { SearchService } from 'src/app/services/search.service';
import { SuggestionBox } from './suggestionbox/suggestionbox.component';

@Component({
  selector: 'searchbar',
  templateUrl: './searchbar.component.html',
  styleUrls: ['./searchbar.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SearchbarComponent implements OnDestroy {
  @ViewChild('input', {static: true, read: ElementRef})
  input?: ElementRef;

  @ViewChild('suggestionbox', {read: SuggestionBox})
  suggestionBox?: SuggestionBox;
  
  opened: boolean = false;
  term: Subject<string> = new Subject();
  lastTerm: string = '';
  results: Subject<[string, string, number][]> = new Subject;
  lastResults: [string, string, number][] = [];

  private _pattern: string = 'Agent';
  get pattern() { return this._pattern; }
  set pattern(value: string) {
    this.engine.switchMode(value ? SearchService.FIND_INSTANCE : SearchService.FIND_PATTERN, value);
    this._pattern = value;
    this.results.next([]);
    this.input!.nativeElement.value = '';
  }

  private debounceDuration = 50;
  private subscription: Subscription = new Subscription;

  constructor(private ref: ElementRef, private engine: SearchService) {
    this.subscription = this.term.pipe(debounceTime(this.debounceDuration)).subscribe(term => {
      let results = this.engine.search(this.lastTerm = term);
      this.lastResults = results;
      this.results.next(results);
    });

    if ( this.pattern )
      this.engine.switchMode(SearchService.FIND_INSTANCE, this.pattern);
  }

  get placeholder(): string {
    if ( !this.pattern ) return 'Rechercher ...';
    return 'Rechercher dans ' + this.pattern;
  }

  get patternWidth(): number {
    if ( !this.pattern ) return 0;
    return SearchService.measureText(this.pattern, '14px Roboto')
  }

  onInput(e: Event) {
    let target = e.target,
      value = (target as any).value;
    
    this.selectionIndex = -1;
    this.term.next(value);
  }

  onFocus(e: Event) {
    this.results.next(this.engine.search(this.lastTerm));
  }

  onFocusOut(e: Event) {
    //this.results.next([]);
  }

  resultNumber: number = 0;
  selectionIndex: number = -1;
  onKeyDown(e: KeyboardEvent) {
    if ( e.code == 'ArrowDown' ) {
      e.preventDefault();
      this.selectionIndex = Math.min(this.selectionIndex+1, this.resultNumber-1);
    }

    if ( e.code == 'ArrowUp' ) {
      e.preventDefault();
      if ( this.selectionIndex == 0 ) this.selectionIndex = -1; //cancel
      else this.selectionIndex = this.selectionIndex - 1;
    }

    if ( e.code == 'Enter' ) {
      e.preventDefault();
      if ( this.selectionIndex !== -1 )
        this.suggestionBox?.navigate(this.selectionIndex);
    }

    if ( e.code == 'Tab' ) {
      e.preventDefault();
      let suggestion = this.lastResults[0];
      if ( !suggestion ) return;
      let pattern = suggestion[0] + suggestion[1];
      this.pattern = pattern;
    }

    if ( e.code == 'Escape' ) {
      e.preventDefault();
      this.pattern = '';
      this.engine.switchMode(SearchService.FIND_PATTERN);
      this.results.next([]);
    }
  }

  onSelectionConfirmed(e: string) {
    if ( !this.pattern )
      this.pattern = e;
    else
      throw 'not yet';
  }

  open() {
    this.opened = !this.opened;
    if ( !this.opened )
      this.results.next([]);
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
}