//These interfaces can help make the code easier to read
//As it says what we can expect from each class

import { Directive } from "@angular/core";
import { Observable, Subject, Subscription } from "rxjs";

@Directive()
export class SubscriptionManager {
  private subscriptions: Map<Observable<any>, Subscription[]> = new Map<Observable<any>, Subscription[]>();
  
  subscribe<T>(observable: Observable<T>, next?: (value: T) => void, error?: (error: any) => void, complete?: () => void) {
    let results = this.subscriptions.get(observable), subscription: Subscription;
    if ( !results )
      this.subscriptions.set(observable, [subscription = observable.subscribe(next, error, complete)]);
    else
      results.push(subscription = observable.subscribe(next, error, complete));
    return subscription;
  }

  once<T>(observable: Observable<T>, next: (value: T) => void) {
    let subscribed: boolean = false, executed: boolean = false, self = this;
    let subscription = this.subscribe(observable, function(this: Observable<T>, t: T) {
      //this can execute before the actual subscription is added to the list
      if ( subscribed )
        self.unsubscribeFrom(observable, subscription);
      
      executed = true;
      next.call(self, t);
    }); subscribed = true;

    if ( subscribed && executed ) this.unsubscribeFrom(observable, subscription);
  }

  unsubscribe<T>(observable: Observable<T>, subscription: Subscription | undefined = undefined) {
    if ( subscription )
      return this.unsubscribeFrom(observable, subscription);
    let results = this.subscriptions.get(observable);
    if ( !results ) return false;
    results.forEach(subscription => subscription.unsubscribe());
    this.subscriptions.delete(observable);
    return true;
  }

  private unsubscribeFrom<T>(observable: Observable<T>, subscription: Subscription) {
    let result = this.subscriptions.get(observable),
      index;
    if ( !result || (index = result.findIndex(sub => sub == subscription)) < 0 ) return false;
    
    subscription.unsubscribe();
    result.splice(index, 1);
    if ( !result.length ) this.subscriptions.delete(observable);
    return true;
  }

  unsubscribeAll() {
    for ( let [subject, _] of this.subscriptions )
      this.unsubscribe(subject);
  }

  ngOnDestroy() {
    this.unsubscribeAll();
  }
};

//For components which are not immediately initialized
export interface Deffered<T = any> extends SubscriptionManager {
  ready: Subject<T>;
  onReady(): void;
};

export interface Updatable {
  start?(...args: any[]): void;
  update(...args: any[]): void; //for path or layout changes
};

export interface Interactive extends Updatable {
  interactiveMode(): void;
  pause(): void;
};

export function shuffle<T>(array: T[]) {
  for ( let i = array.length - 1; i > 0; i-- ) {
    let j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

export function round(x: number, threshold: number = 0.5): number  {
  let int = Math.floor(x), frac = x - int;
  return frac > threshold ? int+1 : int;
}

type FilterMapFunction<U, V> = (t: U) => V | null;

export function filterMap<U, V = U>(array: U[], filterMap: FilterMapFunction<U, V>): V[] {
  return array.map(filterMap).filter(x => x) as unknown as V[];
}