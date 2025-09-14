import { Pipe, PipeTransform } from '@angular/core';
import { Doctor } from '../models/doctor';

@Pipe({
  name: 'doctorName',
  standalone: true,
  pure: true
})
export class DoctorNamePipe implements PipeTransform {
  transform(doctorID: number | null | undefined, doctors: Doctor[]): string {
    if (!doctorID) return '—';
    return doctors.find(d => d.doctorID === doctorID)?.doctorName ?? '—';
  }
}
