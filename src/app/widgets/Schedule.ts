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

  private callback(f: any, mutate: any = (q: any[]) => q.shift()) {
    this.once((_: any) => this.queueNext(mutate));
    f();
  }

  private queueNext(mutate: any) {
    if ( this.q.length ) {
      let [nextF, nextMutate]: [any, any] = mutate(this.q);
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

  queue(f: any, mutate: any = ($q: any[]) => $q.shift()) {
    if ( this.queueReady ) {
      this.queueReady = false;
      this.callback(f, mutate);
    } else {
      this.q.push([f, mutate]);
    }
  }

  emit() {
    this.subject.next();
  }
};