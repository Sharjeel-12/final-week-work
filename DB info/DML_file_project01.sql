--use MuhammadSharjeelFarzadDB;
use sharjeel_6609;
use MuhammadSharjeelFarzadDB;
use MuhammadSharjeelFarzad_6609
-- inserting values into the table named visit types
Insert into visitTypes
values (1,'Follow-Up'),(2,'Emergency'),(3,'Consultation');
go
select * from visitTypes;
go

-- inserting values ino the logger table;
insert into loggers values (1,'Admin'),(2,'Receptionist');
go 
select * from loggers;

-- inserting values into fee schedule table
insert into feeSchedule values (1,'Follow-Up',300),(2,'Emergency',1000),(3,'Consultation',500);
select * from feeSchedule;


-- inserting values into the visits table
INSERT INTO Visits (
    visitID, visitType, VisittypeID, visitDuration, visitDate, visitTime, visitFee
) VALUES
(1,  'Consultation', 3, 30, '2025-08-09', '10:30:00', NULL),
(2,  'Follow-up', 1, 20, '2025-08-09', '11:15:00', NULL),
(3, 'Emergency', 2, 60, '2025-08-09', '12:00:00', NULL);


-- show the visits table
select * from visits
-- to delete the visits from the table run this query
delete from visits;
-- generating random values in the visits table
declare @counter int =1;
While @counter<=20
begin
insert into Visits (visitID, visitType, VisittypeID, visitDuration, visitDate, visitTime, visitFee)
values (@counter,
case 
when @counter%3=1 then 'Follow-Up'
when @counter%3=2 then 'Emergency'
Else 'Consultation'
end,
case 
when @counter%3=1 then 1
when @counter%3=2 then 2
Else 3
end,
15+(@counter%46),
DateAdd(Day,-(@counter%365),GetDate()),
DateAdd(Minute,((@counter*7)%1440),'00:00'),
Null
)
set @counter=@counter+1
end;

-- setting thee visit fee column in the table
update visits
set visits.visitFee=feeSchedule.feePerMinute*visits.visitDuration
from visits join feeSchedule on visits.visitTypeID=feeSchedule.feeID



select visits.visitDuration,feeSchedule.VisitType 
from visits join feeSchedule on visits.visitTypeID=feeSchedule.feeID;

-- adding 20 patient data values in the patient table
delete from patients
INSERT INTO patients (
    patientID, visitID, patientName, patientEmail, patientPhone, patientDescription
) VALUES
(1, 6, 'Michael Davis', 'michael.davis1@example.com', '555-0001', 'Description for Michael Davis'),
(2, 14, 'Sophia Brown', 'sophia.brown2@example.com', '555-0002', 'Description for Sophia Brown'),
(3, 3, 'Daniel Smith', 'daniel.smith3@example.com', '555-0003', 'Description for Daniel Smith'),
(4, 18, 'Aisha Khan', 'aisha.khan4@example.com', '555-0004', 'Description for Aisha Khan'),
(5, 11, 'Hiro Tanaka', 'hiro.tanaka5@example.com', '555-0005', 'Description for Hiro Tanaka'),
(6, 1, 'Liam O’Connor', 'liam.oconnor6@example.com', '555-0006', 'Description for Liam O’Connor'),
(7, 16, 'Fatima Zahra', 'fatima.zahra7@example.com', '555-0007', 'Description for Fatima Zahra'),
(8, 20, 'Carlos Mendez', 'carlos.mendez8@example.com', '555-0008', 'Description for Carlos Mendez'),
(9, 10, 'Elena Petrova', 'elena.petrova9@example.com', '555-0009', 'Description for Elena Petrova'),
(10, 7, 'Rajesh Gupta', 'rajesh.gupta10@example.com', '555-0010', 'Description for Rajesh Gupta'),
(11, 13, 'Julia Schneider', 'julia.schneider13@example.com', '555-0013', 'Description for Julia Schneider'),
(12, 2, 'Pedro Alvarez', 'pedro.alvarez14@example.com', '555-0014', 'Description for Pedro Alvarez'),
(13, 8, 'Amara Okafor', 'amara.okafor15@example.com', '555-0015', 'Description for Amara Okafor'),
(14, 15, 'Chen Wei', 'chen.wei16@example.com', '555-0016', 'Description for Chen Wei'),
(15, 5, 'Omar Farouk', 'omar.farouk18@example.com', '555-0018', 'Description for Omar Farouk'),
(16, 19, 'Lucas Silva', 'lucas.silva19@example.com', '555-0019', 'Description for Lucas Silva'),
(17, 9, 'Isabella Rossi', 'isabella.rossi17@example.com', '555-0021', 'Description for Isabella Rossi'),
(18, 17, 'Noah Williams', 'noah.williams18@example.com', '555-0022', 'Description for Noah Williams'),
(19, 12, 'Emma Dubois', 'emma.dubois19@example.com', '555-0023', 'Description for Emma Dubois'),
(20, 4, 'Olivier Martin', 'olivier.martin20@example.com', '555-0024', 'Description for Olivier Martin');




select * from patients

-- adding doctor data into the tables 
delete from doctors
INSERT INTO doctors (
    doctorID, visitID, doctorName, doctorEmail, doctorPhone, specialization
) VALUES
(1, 14, 'Dr. Emily Carter', 'emily.carter@example.com', '555-1001', 'Cardiology'),
(2, 3, 'Dr. James Wilson', 'james.wilson@example.com', '555-1002', 'Neurology'),
(3, 19, 'Dr. Ayesha Rahman', 'ayesha.rahman@example.com', '555-1003', 'Pediatrics'),
(4, 7, 'Dr. Marco Bianchi', 'marco.bianchi@example.com', '555-1004', 'Orthopedics'),
(5, 10, 'Dr. Sarah Thompson', 'sarah.thompson@example.com', '555-1005', 'Dermatology'),
(6, 2, 'Dr. Ahmed Farouk', 'ahmed.farouk@example.com', '555-1006', 'General Surgery'),
(7, 16, 'Dr. Laura Chen', 'laura.chen@example.com', '555-1007', 'Endocrinology'),
(8, 5, 'Dr. Peter Novak', 'peter.novak@example.com', '555-1008', 'Internal Medicine'),
(9, 8, 'Dr. Fatima Al-Mansoori', 'fatima.almansoori@example.com', '555-1009', 'Obstetrics & Gynecology'),
(10, 1, 'Dr. David Smith', 'david.smith@example.com', '555-1010', 'Psychiatry'),
(11, 12, 'Dr. Thomas Müller', 'thomas.mueller@example.com', '555-1011', 'Pulmonology'),
(12, 20, 'Dr. Brian Johnson', 'brian.johnson@example.com', '555-1012', 'Rheumatology'),
(13, 9, 'Dr. Samuel Kim', 'samuel.kim@example.com', '555-1013', 'Oncology'),
(14, 6, 'Dr. Priya Mehta', 'priya.mehta@example.com', '555-1014', 'ENT Specialist'),
(15, 17, 'Dr. Olivia Martinez', 'olivia.martinez@example.com', '555-1015', 'Gastroenterology'),
(16, 11, 'Dr. Hiroshi Tanaka', 'hiroshi.tanaka@example.com', '555-1016', 'Nephrology'),
(17, 15, 'Dr. Anna Kowalski', 'anna.kowalski@example.com', '555-1017', 'Ophthalmology'),
(18, 18, 'Dr. Lucas Fernandez', 'lucas.fernandez@example.com', '555-1018', 'Urology'),
(19, 13, 'Dr. Sophia Rossi', 'sophia.rossi@example.com', '555-1019', 'Hematology'),
(20, 4, 'Dr. Michael Green', 'michael.green@example.com', '555-1020', 'Emergency Medicine');



select * from doctors

-- Altering the visits table for good,
delete from visits
ALTER TABLE Visits
ADD PatientID INT NOT NULL,
    DoctorID INT NOT NULL;


ALTER TABLE Visits
ADD CONSTRAINT FK_Visits_Patients FOREIGN KEY (PatientID) REFERENCES Patients(PatientID);

ALTER TABLE Visits
ADD CONSTRAINT FK_Visits_Doctors FOREIGN KEY (DoctorID) REFERENCES Doctors(DoctorID);


-- insert into visits table

INSERT INTO visits (
    visitID, patientID, doctorID, visitType, visitTypeID, visitDuration, visitDate, visitTime, visitFee
) VALUES
(1, 6, 10, 'Consultation', 1, 30, '2025-09-10', '10:30:00', 12000),
(2, 12, 6, 'Emergency', 3, 60, '2025-09-10', '15:45:00', 18000),
(3, 3, 2, 'Follow-Up', 2, 15, '2025-09-11', '11:00:00', 8000),
(4, 20, 20, 'Consultation', 1, 30, '2025-09-11', '14:20:00', 11000),
(5, 15, 8, 'Follow-Up', 2, 30, '2025-09-12', '09:15:00', 9000),
(6, 1, 14, 'Emergency', 3, 60, '2025-09-12', '19:30:00', 17000),
(7, 10, 4, 'Consultation', 1, 15, '2025-09-13', '12:10:00', 6000),
(8, 13, 9, 'Follow-Up', 2, 30, '2025-09-13', '16:40:00', 9500),
(9, 17, 13, 'Consultation', 1, 60, '2025-09-14', '10:00:00', 14000),
(10, 9, 5, 'Emergency', 3, 30, '2025-09-14', '18:20:00', 16000),
(11, 5, 16, 'Consultation', 1, 30, '2025-09-15', '13:00:00', 12000),
(12, 19, 11, 'Follow-Up', 2, 15, '2025-09-15', '11:45:00', 7000),
(13, 11, 19, 'Emergency', 3, 60, '2025-09-16', '20:30:00', 17500),
(14, 2, 1, 'Consultation', 1, 30, '2025-09-16', '09:20:00', 10000),
(15, 14, 17, 'Follow-Up', 2, 30, '2025-09-17', '15:30:00', 9500),
(16, 7, 7, 'Consultation', 1, 60, '2025-09-17', '12:50:00', 13500),
(17, 18, 15, 'Emergency', 3, 30, '2025-09-18', '19:10:00', 16000),
(18, 4, 18, 'Consultation', 1, 30, '2025-09-18', '14:10:00', 12000),
(19, 16, 3, 'Follow-Up', 2, 15, '2025-09-19', '10:30:00', 8000),
(20, 8, 12, 'Consultation', 1, 30, '2025-09-19', '11:45:00', 11500);

select * from visits
delete from visits


-- creating stored procedures for the better 
CREATE PROCEDURE CreateVisit
    @VID INT,
    @T NVARCHAR(50),
    @TID INT,
    @Dur INT,
    @Date DATE,
    @Time TIME,
    @Fee DECIMAL(10,2),
    @PID INT,
    @DID INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;

    -- Combine date + time into full datetime
    DECLARE @NewVisitDateTime DATETIME = CAST(@Date AS DATETIME) + CAST(@Time AS DATETIME);

    -- Check for overlap with same doctor
    IF EXISTS (
        SELECT 1
        FROM Visits
        WHERE DoctorID = @DID
          AND (CAST(VisitDate AS DATETIME) + CAST(VisitTime AS DATETIME)) 
              < DATEADD(MINUTE, @Dur, @NewVisitDateTime)
          AND DATEADD(MINUTE, VisitDuration, (CAST(VisitDate AS DATETIME) + CAST(VisitTime AS DATETIME))) 
              > @NewVisitDateTime
    )
    BEGIN
        RAISERROR('Conflict: overlapping appointment', 16, 1);
        ROLLBACK TRANSACTION;
        RETURN;
    END

    -- Insert new visit
    INSERT INTO Visits 
        (VisitID, VisitType, VisitTypeID, VisitDuration, VisitDate, VisitTime, VisitFee, PatientID, DoctorID)
    VALUES 
        (@VID, @T, @TID, @Dur, @Date, @Time, @Fee, @PID, @DID);

    COMMIT TRANSACTION;
END




select * from users


-- creating request log table

IF OBJECT_ID('dbo.RequestLog', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.RequestLog (
        Id            INT IDENTITY(1,1) PRIMARY KEY,
        UserID        INT NULL,
        LogMessage    NVARCHAR(500) NOT NULL,
        StartTimeUtc  DATETIME2(3)  NOT NULL,
        EndTimeUtc    DATETIME2(3)  NOT NULL,
        [Date]        DATE          NOT NULL
    );

    CREATE INDEX IX_RequestLog_Date ON dbo.RequestLog([Date]);
END


select * from RequestLog


-- activity logger here 
IF OBJECT_ID('dbo.ActivityLogs', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.ActivityLogs
    (
        LogID        INT IDENTITY(1,1) PRIMARY KEY,
        UserID       INT NULL,
        LogMessage   NVARCHAR(500) NOT NULL,
        ActivityTime TIME(3) NOT NULL,
        ActivityDate DATE     NOT NULL,
        CONSTRAINT FK_ActivityLogs_Users
            FOREIGN KEY (UserID) REFERENCES dbo.Users(Id)
    );

    -- Useful index for filtering by user & date
    CREATE INDEX IX_ActivityLogs_User_Date ON dbo.ActivityLogs(UserID, ActivityDate);
END

select * from ActivityLogs


select * from users