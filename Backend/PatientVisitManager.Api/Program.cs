using System.Text;
using FluentValidation;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Serilog;
using Serilog.Debugging;
using PatientVisitManager.Api.Middlewares;
using PatientVisitManager.Api.Repositories.Interfaces;
using PatientVisitManager.Api.Repositories.Sql;
using PatientVisitManager.Api.Services.Interfaces;
using PatientVisitManager.Api.Services;
using PatientVisitManager.Api.Filters;
using Microsoft.Data.SqlClient;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

var builder = WebApplication.CreateBuilder(args);

// Serilog
SelfLog.Enable(msg => Console.Error.WriteLine("[Serilog] " + msg));
Log.Logger = new LoggerConfiguration().WriteTo.Console().CreateLogger();
try
{
    Log.Logger = new LoggerConfiguration().ReadFrom.Configuration(builder.Configuration).CreateLogger();
}
catch
{
    Log.Logger = new LoggerConfiguration()
        .MinimumLevel.Information()
        .WriteTo.File("logs/log-.txt", rollingInterval: RollingInterval.Day)
        .CreateLogger();
}
builder.Host.UseSerilog();

Serilog.Log.Information("Starting PatientVisitManager (Environment={Env})", builder.Environment.EnvironmentName);

// MVC + Filters
builder.Services.AddControllers(options => {
    options.Filters.Add<ValidationFilter>();
    options.Filters.Add<FluentValidationFilter>();
});

builder.Services.AddValidatorsFromAssemblyContaining<Program>();

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c => {
    var jwt = new OpenApiSecurityScheme
    {
        Scheme = "bearer",
        BearerFormat = "JWT",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.Http,
        Description = "Enter: Bearer {token}",
        Reference = new OpenApiReference { Id = "Bearer", Type = ReferenceType.SecurityScheme }
    };
    c.AddSecurityDefinition("Bearer", jwt);
    c.AddSecurityRequirement(new OpenApiSecurityRequirement { { jwt, Array.Empty<string>() } });
});

builder.Services.AddCors(o => o.AddPolicy("dev", p => p.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod()));

// Auth (JWT) with diagnostics
JwtSecurityTokenHandler.DefaultMapInboundClaims = false;

var rawKey = builder.Configuration["Jwt:Key"];
if (string.IsNullOrWhiteSpace(rawKey) || rawKey.Trim().Length < 32)
{
    Serilog.Log.Warning("Jwt:Key missing/too short. Length={Len}. Tokens may fail validation.",
        rawKey?.Trim().Length ?? 0);
}
var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes((rawKey ?? "").Trim()));

builder.Services.AddAuthentication(o => {
    o.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    o.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(o => {
    o.RequireHttpsMetadata = false;
    o.SaveToken = true;
    o.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = false,
        ValidateAudience = false,
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = key,
        ValidateLifetime = true,
        ClockSkew = TimeSpan.FromMinutes(1),
        RoleClaimType = ClaimTypes.Role,
        NameClaimType = ClaimTypes.NameIdentifier
    };

    o.Events = new JwtBearerEvents
    {
        OnAuthenticationFailed = ctx =>
        {
            Serilog.Log.Error(ctx.Exception, "JWT authentication failed");
            return Task.CompletedTask;
        },
        OnChallenge = ctx =>
        {
            Serilog.Log.Warning("JWT challenge: error={Error}, description={Description}",
                ctx.Error, ctx.ErrorDescription);
            return Task.CompletedTask;
        },
        OnTokenValidated = ctx =>
        {
            var email = ctx.Principal?.FindFirst(ClaimTypes.Email)?.Value
                        ?? ctx.Principal?.FindFirst(JwtRegisteredClaimNames.Email)?.Value
                        ?? "(no-email)";
            var role = ctx.Principal?.FindFirst(ClaimTypes.Role)?.Value ?? "(no-role)";
            Serilog.Log.Information("JWT validated for Email={Email}, Role={Role}", email, role);
            return Task.CompletedTask;
        }
    };
});

builder.Services.AddAuthorization(o => {
    o.AddPolicy("RequireAdmin", p => p.RequireRole("Admin"));
    o.AddPolicy("RequireDoctorOrAdmin", p => p.RequireRole("Doctor", "Admin"));
    o.AddPolicy("RequireReceptionistOrAdmin", p => p.RequireRole("Receptionist", "Admin"));
});

builder.Services.AddSingleton<IConfiguration>(builder.Configuration);
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IPatientRepository, PatientRepository>();
builder.Services.AddScoped<IDoctorRepository, DoctorRepository>();
builder.Services.AddScoped<IVisitRepository, VisitRepository>();
builder.Services.AddScoped<IFeeScheduleRepository, FeeScheduleRepository>();
builder.Services.AddScoped<IActivityLogRepository, ActivityLogRepository>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IFeeCalculator, FeeCalculator>();
builder.Services.AddScoped<IRequestLogWriter, RequestLogWriter>();
builder.Services.AddScoped<IRuleRepository, RuleRepository>();
builder.Services.AddScoped<IVisitNoteRepository, VisitNoteRepository>();
builder.Services.AddScoped<IBillingRepository, BillingRepository>();

var app = builder.Build();

Serilog.Log.Information("Kestrel URLs: {Urls}", string.Join(", ", app.Urls));

// Middlewares
app.UseMiddleware<RequestLoggingTimingMiddleware>();
app.UseMiddleware<ExceptionHandlingMiddleware>();

app.UseSwagger();
app.UseSwaggerUI();

app.UseCors("dev");

// Serve login.html by default at root
var defaultFiles = new DefaultFilesOptions();
defaultFiles.DefaultFileNames.Clear();
defaultFiles.DefaultFileNames.Add("login.html");
app.UseDefaultFiles(defaultFiles);

app.UseStaticFiles();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

//Fallback to login.html for non-API routes
app.MapFallbackToFile("/login.html");

// DB Connectivity Check (startup)
try
{
    var cs = builder.Configuration.GetConnectionString("DefaultConnection");
    using var conn = new SqlConnection(cs);
    conn.Open();
    using var cmd = new SqlCommand("SELECT DB_NAME()", conn);
    var db = (string?)cmd.ExecuteScalar();
    Log.Information(" DB connectivity OK. Connected to database: {Database}", db);
}
catch (SqlException ex)
{
    var errs = string.Join("; ", ex.Errors.Cast<SqlError>()
        .Select(e => $"[{e.Number}] {e.Message} (State {e.State}, Class {e.Class})"));
    Log.Error(ex, " SQL connectivity failed: {Errors}", errs);
    throw;
}
catch (Exception ex)
{
    Log.Error(ex, " Unexpected error while opening DB connection");
    throw;
}

app.Run();
