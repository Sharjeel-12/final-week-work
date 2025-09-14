import { Pipe, PipeTransform } from '@angular/core';
import { Patient } from '../models/patient';

@Pipe({
  name: 'patientName',
  standalone: true,   
  pure: true
})
export class PatientNamePipe implements PipeTransform {
  transform(patientID: number | null | undefined, patients: Patient[]): string {
    if (!patientID) return '—';
    return patients.find(p => p.patientID === patientID)?.patientName ?? '—';
  }
}
