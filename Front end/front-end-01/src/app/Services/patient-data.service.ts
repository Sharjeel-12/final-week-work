import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Patient } from '../models/patient';
import { CreatePatientDto } from '../models/create-patient-dto';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PatientDataService {

baseUrl:string="http://localhost:49428/api/Patients";
  constructor(private http:HttpClient) {}

  getAllPatients():Observable<Patient[]>{
    return this.http.get<Patient[]>(this.baseUrl)
  }
  getPatientByID(id:number):Observable<Patient>{
    return this.http.get<Patient>(this.baseUrl+`/${id}`,{headers:{'Authorization':'Bearer '+sessionStorage.getItem('access_token')}})
  }
  deletePatientByID(id:number|null|undefined):Observable<Patient>{
    return this.http.delete<Patient>(this.baseUrl+`/${id}`,{headers:{'Authorization':'Bearer '+sessionStorage.getItem('access_token')}})
  }
  AddNewPatient(p:CreatePatientDto):Observable<Patient|void>{
    return this.http.post<Patient>(this.baseUrl,p,{headers:{'Authorization':"Bearer "+sessionStorage.getItem('access_token')}})
  }
  UpdatePatient(id:number,body:Patient):Observable<Patient|void>{
        return this.http.put<Patient>(this.baseUrl+`/${id}`,body,{headers:{'Authorization':"Bearer "+sessionStorage.getItem('access_token')}})

  }

}
