# Patient Visit Manager - .NET 7 Web API (JWT, ADO.NET, Serilog, FluentValidation)

## Quick Start

1. Ensure SQL Server is running and execute your provided schema to create `PatientVisitDb` and all tables.
2. Update `appsettings.json` -> `ConnectionStrings:DefaultConnection` if needed.
3. `dotnet restore`
4. `dotnet run` (launches on default Kestrel port, e.g., http://localhost:5136)
5. Visit Swagger: `/swagger`
6. Static frontend is served from `wwwroot/`:
   - `http://localhost:5136/login.html`
   - `http://localhost:5136/patients.html`
   - `http://localhost:5136/doctors.html`
   - `http://localhost:5136/visits.html`

### Auth
- POST `/api/auth/register` -> create Admin/Doctor/Receptionist
- POST `/api/auth/login` -> returns `{ token, role, email }`
- Use the token as `Authorization: Bearer <token>` for protected endpoints.

### Roles & Policies
- PatientsController -> `RequireReceptionistOrAdmin`
- DoctorsController -> `RequireDoctorOrAdmin`
- VisitsController -> authenticated read; create/update `RequireReceptionistOrAdmin`; delete `RequireAdmin`
- FeeScheduleController -> any authenticated

### Middlewares
- ExceptionHandlingMiddleware -> ProblemDetails JSON on errors
- RequestLoggingTimingMiddleware -> logs to Serilog
- Serilog writes to `logs/` (rolling daily)

### Validation
- FluentValidation is wired; invalid requests return 400 with consistent payload.

### Notes
- Fee calculation uses Strategy (`IFeeCalculator`).
- ADO.NET repositories use `Microsoft.Data.SqlClient`.
