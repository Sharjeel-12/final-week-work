 --use MuhammadSharjeelFarzadDB;
 use sharjeel_6609;
go
-- =======Look Up Tables========== --

create table visitTypes(
typeID int primary key,
typeName varchar(200) unique
 
)
go
create table loggers(
loggerID int primary key,
name varchar(100)
)
go
create table loggerActivities(
ActivityID int primary key Identity(1,1),
activityDescription varchar(2000),
loggerID int, 
foreign key(loggerID) references loggers(loggerID)

)
go
alter table loggerActivities
add ActivityDate date, ActivityTime time;
go
create table feeSchedule(
feeID int primary key,
VisitType varchar(100),
feePerMinute Decimal(10,2)
)



-- =============================== --

go

create table Visits(
visitID int primary key,
visitType varchar(200),
VisittypeID int,
visitDuration int,
visitDate date,
visitTime time,
visitFee decimal(10,2),
foreign key(VisittypeID) references visitTypes(typeID)
)

 go
create table patients(
patientID int primary key,
visitID int unique,
patientName varchar(200),
patientEmail varchar(200),
patientPhone varchar(200),
patientDescription varchar(1000),
Foreign key(visitID) references visits(visitID)
)
go

create table doctors(
doctorID int primary key,
visitID int,
doctorName varchar(200),
doctorEmail varchar(200),
doctorPhone varchar(200),
specialization varchar(1000),
Foreign key(visitID) references visits(visitID)

)

go





