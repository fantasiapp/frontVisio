import { Subject } from 'rxjs';

export class SequentialSchedule {
  private subject: Subject<unknown>;
  private q: any[];
  private queueReady: boolean;

  constructor() {
    this.subject = new Subject();
    this.q = [];
    this.queueReady = true;
  }

  private callback(f: any, next: any = (q: any[]) => q.shift()) {
    this.once((_: any) => this.queueNext(next));
    f();
  }

  private queueNext(next: any) {
    if ( this.q.length ) {
      let [nextF, nextMutate]: [any, any] = next(this.q);
      this.callback(nextF, nextMutate);
    } else {
      this.queueReady = true;
    }
  }

  once(f: any) {
    let subscription = this.subject.subscribe((...args: any[]) => {
      f(...args);
      subscription.unsubscribe();
    });
  }

  queue(f: any, next: any = (q: any[]) => q.shift()) {
    if ( this.queueReady ) {
      this.queueReady = false;
      this.callback(f, next);
    } else {
      this.q.push([f, next]);
    }
  }

  next() {
    this.subject.next();
  }
};