import { Directive, Input, forwardRef } from '@angular/core';
import { AbstractControl, NG_VALIDATORS, ValidationErrors, Validator } from '@angular/forms';

@Directive({
  selector: '[businessHours]',
  standalone: true,
  providers: [{
    provide: NG_VALIDATORS,
    useExisting: forwardRef(() => BusinessHoursDirective),
    multi: true
  }]
})
export class BusinessHoursDirective implements Validator {
  // "HH:mm" 24h 
  @Input() businessHoursStart: string = '09:00';
  @Input() businessHoursEnd: string = '21:00';

  @Input() businessHoursDays: string = '1,2,3,4,5,6';
  // whether end time is inclusive 
  @Input() businessHoursEndInclusive: string | boolean = false;

  private toMinutes(hhmm: string): number {
    const [h, m] = (hhmm || '').split(':').map(Number);
    return (h ?? 0) * 60 + (m ?? 0);
  }

  validate(control: AbstractControl): ValidationErrors | null {
    const raw = control.value;
    if (!raw) return null; // let required handle empty

    const date = raw instanceof Date ? raw : new Date(raw);
    if (isNaN(date as unknown as number)) {
      return { businessHours: { reason: 'invalidDate' } };
    }

    const allowedDays = this.businessHoursDays.split(',').map(s => Number(s.trim())).filter(n => !Number.isNaN(n));
    const startMin = this.toMinutes(this.businessHoursStart);
    const endMin = this.toMinutes(this.businessHoursEnd);
    const endInclusive = (typeof this.businessHoursEndInclusive === 'string')
      ? (this.businessHoursEndInclusive === '' || this.businessHoursEndInclusive.toLowerCase() === 'true')
      : !!this.businessHoursEndInclusive;

    const day = date.getDay();
    if (!allowedDays.includes(day)) {
      return { businessHours: { reason: 'nonWorkingDay', day, allowedDays } };
    }

    const minutes = date.getHours() * 60 + date.getMinutes();
    const okStart = minutes >= startMin;
    const okEnd = endInclusive ? minutes <= endMin : minutes < endMin;

    if (!okStart || !okEnd) {
      const picked = `${String(date.getHours()).padStart(2,'0')}:${String(date.getMinutes()).padStart(2,'0')}`;
      return { businessHours: { reason: 'offHours', picked, allowed: { start: this.businessHoursStart, end: this.businessHoursEnd, endInclusive } } };
    }
    return null;
  }
}
