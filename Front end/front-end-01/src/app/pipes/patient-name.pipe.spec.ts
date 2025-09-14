import { PatientNamePipe } from './patient-name.pipe';

describe('PatientNamePipe', () => {
  it('create an instance', () => {
    const pipe = new PatientNamePipe();
    expect(pipe).toBeTruthy();
  });
});
