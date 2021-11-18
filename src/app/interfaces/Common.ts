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

export type Dict<T = any> = {[key: string]: T};

export class Utils {
  static shallowArrayEquality(obj: any[], other: any[]): boolean {
    let l = obj.length;
    if ( l != other.length ) return false;
    
    for ( let i = 0; i < l; i++ )
      if ( obj[i] != other[i] ) return false;
    return true;
  }

  static deepEqual(obj: any, other: any): boolean {
    if ( Array.isArray(obj) && Array.isArray(other) )
      return this.deepArrayEquality(obj, other);
    if ( typeof obj == 'object' && typeof other == typeof obj )
      return this.deepObjectEquality(obj, other);
    else
      return obj === other;
  }

  static deepArrayEquality(obj: any[], other: any[]): boolean {
    let l = obj.length;
    if ( l != other.length ) return false;

    for ( let i = 0;  i < l; i++ )
      if (!this.deepEqual(obj[i], other[i])) return false;
    return true;
  }

  
  static shallowObjectEquality(obj: Dict, other: Dict): boolean {
    let objKeys: string[] = Object.keys(obj),
      otherKeys: string[] = Object.keys(other);
    
    if ( !this.shallowArrayEquality(objKeys, otherKeys) ) return false;
    for ( let key of objKeys )
      if ( obj[key] != other[key] ) return false;
    return true;
  }

  static deepObjectEquality(obj: Dict, other: Dict): boolean {
    let objKeys: string[] = Object.keys(obj),
      otherKeys: string[] = Object.keys(other);
    
    if ( !this.shallowArrayEquality(objKeys, otherKeys) ) return false;
    for ( let key of objKeys )
      if ( !this.deepEqual(obj[key], other[key]) ) return false;
    return true;
  }

  static shallowCopy(obj: Dict): Dict {
    return Object.assign({}, obj);
  }

  //Dict only
  static dictDeepCopy(obj: Dict): Dict {
    if ( !obj || typeof obj !== 'object' || Array.isArray(obj) ) return obj;
    let copy: Dict = {};
    for ( let [key, val] of Object.entries(obj) ) {
      let valType = typeof val,
        isLiteral = valType == 'boolean' || valType == 'number' || valType == 'string',
        isFunction = valType == 'function';

      if ( isLiteral || isFunction ) copy[key] = obj[key];
      else copy[key] = this.dictDeepCopy(val);
    }
    return copy;
  }

  //Dict only
  static dictDeepMerge(base: Dict, ext: Dict) {
    if ( typeof base !== 'object' )
      throw `${typeof base} does not support merge operation.`;
    
    let result = this.shallowCopy(base);
    for ( let [key, val] of Object.entries(ext) ) {
      let valType = typeof val,
        isLiteral = valType == 'boolean' || valType == 'number' || valType == 'string',
        isFunction = valType == 'function',
        origValue = result[key];
      
      if ( !result[key] ) {
        if ( isLiteral || isFunction || Array.isArray(origValue) ) result[key] = val;
        else result[key] = this.dictDeepCopy(val);
      } else {
        if ( isLiteral || isFunction || Array.isArray(origValue) ) //replace baisc types including arrays
          result[key] = this.dictDeepCopy(val);
        else
          result[key] = this.dictDeepMerge(origValue, val);
      }
    }
    return result;
  }

  static firstDigit(q: number) {
    return -Math.floor(Math.log10(q));
  }

  static format(q: number, n: number = 3, integer: boolean = false): string {
    let p = Math.round(q);
    let base = Math.pow(10, n);
    let str = '';
    
    if ( Math.floor(q) == 0 )
      return integer ? p.toString() : q.toFixed(Math.min(3, this.firstDigit(q))).toString();

    while (p >= base) {
      str = (p % base).toString().padStart(n, '0') + ' ' + str;
      p = (p / base) | 0;
    };
    if ( p ) str = p.toString() + ' ' + str;
    if ( !str ) str = '0';

    return str.trim();
  }

  static convert(str: string): number {
    return +(str.replace(/\s+/g, '').replace(/\,/g, '.'));
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
};