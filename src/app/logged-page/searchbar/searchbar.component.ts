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
  private debounceDuration = 50;
  private subscription: Subscription = new Subscription;

  constructor(private ref: ElementRef, private engine: SearchService) {
    this.subscription = this.term.pipe(debounceTime(this.debounceDuration)).subscribe(term => {
      let results = this.engine.search(this.lastTerm = term);
      this.results.next(results);
      this.resultNumber = results.length;
    });    
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