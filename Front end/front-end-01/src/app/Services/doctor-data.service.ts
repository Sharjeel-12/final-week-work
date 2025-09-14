import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Doctor } from '../models/doctor';
import { CreateDoctorDto } from '../models/create-doctor-dto';
@Injectable({
  providedIn: 'root'
})
export class DoctorDataService {
baseUrl:string="http://localhost:49428/api/Doctors";
  constructor(private http:HttpClient) {
   }

  getAllDoctors():Observable<Doctor[]>{
    return this.http.get<Doctor[]>(this.baseUrl,{headers:{'Authorization':'Bearer '+sessionStorage.getItem('access_token')}})
  }
  getDoctorByID(id:number):Observable<Doctor>{
    return this.http.get<Doctor>(this.baseUrl+`/${id}`,{headers:{'Authorization':'Bearer '+sessionStorage.getItem('access_token')}})
  }
  deleteDoctorByID(id:number|null|undefined):Observable<Doctor>{
    return this.http.delete<Doctor>(this.baseUrl+`/${id}`,{headers:{'Authorization':'Bearer '+sessionStorage.getItem('access_token')}})
  }
  AddNewDoctor(p:CreateDoctorDto):Observable<Doctor|void>{
    return this.http.post<Doctor>(this.baseUrl,p,{headers:{'Authorization':"Bearer "+sessionStorage.getItem('access_token')}})
  }
  UpdateDoctor(id:number,body:Doctor):Observable<Doctor|void>{
        return this.http.put<Doctor>(this.baseUrl+`/${id}`,body,{headers:{'Authorization':"Bearer "+sessionStorage.getItem('access_token')}})

  }
}
