use MuhammadSharjeelFarzadDB;
go
-- procedure for creating a new record of patient
create procedure stp_CreateNewRecord @patientID int, @patientName varchar(100), @patientEmail varchar(200),
@patientPhone varchar(200), @patientDescription varchar(1000), @visitID int, @doctorID int, @doctorName varchar(200), @doctorEmail varchar(200),
@doctorPhone varchar(200), @specialization varchar(1000), @visitType varchar(200), @visitDuration int,@visitDate date,@visitTime time
as
begin
begin try
begin transaction
insert into Visits(visitID,visitType,VisittypeID,visitDuration,visitDate,visitTime,visitFee)
values(@visitID,@visitType,
case
when @visitType='Consultation' then 3
when @visitType='Follow-Up' then 1
else 2
end,
@visitDuration,@visitDate,@visitTime,
case
when @visitType='Consultation' then @visitDuration*500
when @visitType='Follow-Up' then @visitDuration*300
else @visitDuration*1000
end
);

insert into patients(patientID, visitID, patientName, patientEmail, patientPhone, patientDescription) 
values(@patientID,@visitID,@patientName,@patientEmail,@patientPhone,@patientDescription);

insert into doctors(doctorID, visitID, doctorName, doctorEmail, doctorPhone, specialization)
values (@doctorID,@visitID,@doctorName,@doctorEmail,@doctorPhone,@specialization);

insert into loggerActivities(activityDescription,LoggerID,ActivityDate, ActivityTime) values
('Created the Patient Record: '+@patientName +', Doctor Assigned: '+@doctorName,1,cast(getdate() as date),cast(getdate() as time));
commit transaction
end try
begin catch
rollback transaction;
throw;
end catch
end;
go

-- procedure to delete the entire patient record 
create procedure sp_DeletePAtientRecord @VisitID int
as 
begin
delete from patients where visitID=@VisitID
delete from doctors where visitID=@VisitID
delete from visits where visitID=@VisitID
insert into loggerActivities(activityDescription,LoggerID,ActivityDate, ActivityTime) values
('Deleted the patient record with visit ID: '+@VisitID,1,cast(getdate() as date),cast(getdate() as time));
end;
go

-- Updating the patient record
create procedure sp_UpdateRecord @visitID int, @NewpatientName varchar(100), @NewpatientEmail varchar(200),
@NewpatientPhone varchar(200), @NewpatientDescription varchar(1000), @NewdoctorName varchar(200), @NewdoctorEmail varchar(200),
@NewdoctorPhone varchar(200), @Newspecialization varchar(1000), @NewvisitType varchar(200), @NewvisitDuration int,@NewvisitDate date,@NewvisitTime time
as 
begin
begin try
begin transaction
update visits
set 
visitType=@NewvisitType,
visitDuration=@NewvisitDuration,
visitDate=@NewvisitDate,
visitTime=@NewvisitTime,
VisittypeID=case when @NewvisitType='Consultation' then 3 when @NewvisitType='Follow-Up' then 1 else 2 end,
VisitFee=case when @NewvisitType='Consultation' then @NewvisitDuration*500 when @NewvisitType='Follow-Up' then @NewvisitDuration*300 else @NewvisitDuration*1000 end
where visitID=@visitID;

update patients 
set 
patientName=@newPatientName,
patientEmail=@NewpatientEmail,
patientPhone=@newPatientPhone,
patientDescription=@NewpatientDescription
where visitID=@visitID;

update doctors 
set 
DoctorName=@newDoctorName,
DoctorEmail=@NewDoctorEmail,
DoctorPhone=@newDoctorPhone,
Specialization=@Newspecialization
where visitID=@visitID;

insert into loggerActivities(activityDescription,LoggerID,ActivityDate, ActivityTime) values
('Updated the patient record with visit ID: '+@VisitID,1,cast(getdate() as date),cast(getdate() as time));

commit transaction
end try

begin catch
rollback transaction;
throw;
end catch
end;

go
-- procedure for searching all the records of a patient
create procedure stp_getAllPatientRecord 
@loggerID int
as
begin 
Insert into loggerActivities(activityDescription,loggerID,ActivityDate,ActivityTime )
values ('Viewed All the Patient Records', @loggerID,cast(getdate() as date),cast(getdate() as time));
select * from patients;
end;
go

-- execute this procedure to get the record of all patients
--exec stp_getAllPatientRecord @loggerID=1


-- procedure to get a Patient by Patient ID
go 
create procedure stp_GetPatientByID @patientID int, @loggerID int
as
begin
Insert into loggerActivities(activityDescription,loggerID,ActivityDAte,ActivityTime)
values ('Viewed record of a patient with patient ID: '+cast(@patientID as varchar(10)), @loggerID,cast(getdate() as date),cast(getdate() as time));
select * from patients where patientID=@patientID;
end;

go

--exec stp_getPAtientbyID @patientID=6, @loggerID=2

go

-- procedure to search all the patients against a particular doctor name
create procedure stp_GetPatientByDoctorName @doctorName varchar(100), @loggerID int
as begin
select patients.PatientName, patients.patientDescription,visits.visitType,visits.VisitFee from 
Doctors join Patients on (doctors.VisitID=patients.VisitID and doctors.doctorName=@doctorName)
join Visits on (doctors.visitID=visits.visitID); 
Insert into loggerActivities(activityDescription,loggerID,ActivityDAte,ActivityTime)
values ('Checked the patients of the doctor: '+@doctorName, @loggerID,cast(getdate() as date),cast(getdate() as time));

end;
go
-- procedure for viewing no. of patients occupied by each doctor
create procedure  stp_ViewDoctorOccupation @loggerID int 
as
begin
select doctors.doctorname, Count(patients.patientName) as [patientCount] from 
doctors join patients on doctors.visitID=patients.visitID group by doctors.doctorName;
Insert into loggerActivities(activityDescription,loggerID,ActivityDAte,ActivityTime)
values ('Viewed the Doctor Occupation Table', @loggerID,cast(getdate() as date),cast(getdate() as time));
end;
go
-- procedure for viewing patient by visit ID
create procedure stp_GetPatientByVisitID @VisitID int, @loggerID int
as begin
select * from patients where visitID=@visitID;

Insert into loggerActivities(activityDescription,loggerID,ActivityDAte,ActivityTime)
values ('Viewed the patient record at visit ID'+cast(@VisitID as varchar(100)), @loggerID,cast(getdate() as date),cast(getdate() as time));

end;
-- procedure for viewing doctor by visit ID
go
create procedure stp_GetDoctorByVisitID @VisitID int, @loggerID int
as begin
select * from doctors where visitID=@visitID;

Insert into loggerActivities(activityDescription,loggerID,ActivityDAte,ActivityTime)
values ('Viewed the doctor record at visit ID'+cast(@VisitID as varchar(100)), @loggerID,cast(getdate() as date),cast(getdate() as time));

end;
-- procedure for viewing the visit details
go
create procedure stp_GetVisitDetails @VisitID int, @loggerID int
as begin
select * from visits where visitID=@visitID;

Insert into loggerActivities(activityDescription,loggerID,ActivityDAte,ActivityTime)
values ('Viewed the visit details at visit ID'+cast(@VisitID as varchar(100)), @loggerID,cast(getdate() as date),cast(getdate() as time));

end;
go

