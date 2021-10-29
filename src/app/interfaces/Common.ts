//These interfaces can help make the code easier to read
//As it says what we can expect from each class

import { Observable, PartialObserver, Subject, Subscription } from "rxjs";

export class SubscriptionManager {
  private subscriptions: Map<Observable<any>, Subscription[]> = new Map<Observable<any>, Subscription[]>();
  
  subscribe<T>(observable: Observable<T>, next?: (value: T) => void, error?: (error: any) => void, complete?: () => void): void {
    let results = this.subscriptions.get(observable), subscription: Subscription;
    if ( !results )
      this.subscriptions.set(observable, [subscription = observable.subscribe(next, error, complete)]);
    else
      results.push(subscription = observable.subscribe(next, error, complete));
  }

  once<T>(observable: Observable<T>, next: (value: T) => void) {
    let subscribed: boolean = false, executed: boolean = false, self = this;
    this.subscribe(observable, function(this: Observable<T>, t: T) {
      //this can execute before the actual subscription is added to the list
      if ( subscribed )
        self.unsubscribe(observable);
      
      executed = true;
      next.call(this, t);
    }); subscribed = true;

    if ( subscribed && executed ) this.unsubscribe(observable);
  }

  unsubscribe<T>(observable: Observable<T>): void {
    let results = this.subscriptions.get(observable);
    if ( !results ) return;
    results.forEach(subscription => subscription.unsubscribe());
    this.subscriptions.delete(observable);
  }

  unsubscribeAll() {
    for ( let [subject, _] of this.subscriptions )
      this.unsubscribe(subject);
  }
};

//For components which are not immediately initialized
export interface Deffered<T = any> extends SubscriptionManager {
  ready: Subject<T>;
  onReady(): void;
};

export interface Updatable {
  update(...args: any[]): void;
  refresh(...args: any[]): void;
};

export interface Interactive extends Updatable {
  interactiveMode(): void;
  pause(): void;
};