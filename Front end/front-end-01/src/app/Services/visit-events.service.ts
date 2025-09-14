import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export type VisitStatus = 'pending' | 'scheduled';

export interface VisitStatusChanged {
  visitID: number;
  status: VisitStatus;
}

@Injectable({ providedIn: 'root' })
export class VisitEventsService {
  // Broadcast when a visit's status changes
  readonly visitStatusChanged$ = new Subject<VisitStatusChanged>();

  emitVisitStatusChanged(evt: VisitStatusChanged) {
    this.visitStatusChanged$.next(evt);
  }
}
