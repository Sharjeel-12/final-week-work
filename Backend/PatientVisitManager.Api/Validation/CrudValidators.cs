using FluentValidation;
using PatientVisitManager.Api.DTOs;

namespace PatientVisitManager.Api.Validation;

public class CreatePatientValidator : AbstractValidator<CreatePatientDto>
{
    public CreatePatientValidator()
    {
        RuleFor(x => x.patientName).NotEmpty().MaximumLength(200);
        RuleFor(x => x.patientEmail).NotEmpty().EmailAddress();
        RuleFor(x => x.patientPhone).NotEmpty();
    }
}

public class UpdatePatientValidator : AbstractValidator<UpdatePatientDto>
{
    public UpdatePatientValidator()
    {
        RuleFor(x => x.patientID).GreaterThan(0);
        RuleFor(x => x.patientName).NotEmpty().MaximumLength(200);
        RuleFor(x => x.patientEmail).NotEmpty().EmailAddress();
        RuleFor(x => x.patientPhone).NotEmpty();
    }
}

public class CreateDoctorValidator : AbstractValidator<CreateDoctorDto>
{
    public CreateDoctorValidator()
    {
        RuleFor(x => x.DoctorName).NotEmpty().MaximumLength(200);
        RuleFor(x => x.DoctorEmail).NotEmpty().EmailAddress();
        RuleFor(x => x.DoctorPhone).NotEmpty();
        RuleFor(x => x.Specialization).NotEmpty();
    }
}

public class UpdateDoctorValidator : AbstractValidator<UpdateDoctorDto>
{
    public UpdateDoctorValidator()
    {
        RuleFor(x => x.DoctorID).GreaterThan(0);
        RuleFor(x => x.DoctorName).NotEmpty().MaximumLength(200);
        RuleFor(x => x.DoctorEmail).NotEmpty().EmailAddress();
        RuleFor(x => x.DoctorPhone).NotEmpty();
        RuleFor(x => x.Specialization).NotEmpty();
    }
}

public class CreateVisitValidator : AbstractValidator<CreateVisitDto>
{
    public CreateVisitValidator()
    {
        RuleFor(x => x.VisitType).NotEmpty();
        RuleFor(x => x.VisitDuration).GreaterThan(0);
        RuleFor(x => x.VisitDate).NotEmpty();
    }
}

public class UpdateVisitValidator : AbstractValidator<UpdateVisitDto>
{
    public UpdateVisitValidator()
    {
        RuleFor(x => x.VisitID).GreaterThan(0);
        RuleFor(x => x.VisitType).NotEmpty();
        RuleFor(x => x.VisitDuration).GreaterThan(0);
        RuleFor(x => x.VisitDate).NotEmpty();
    }
}
