using System.Diagnostics;
using System.Security.Claims;
using PatientVisitManager.Api.Services;

namespace PatientVisitManager.Api.Middlewares;

public class RequestLoggingTimingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<RequestLoggingTimingMiddleware> _logger;

    public RequestLoggingTimingMiddleware(
        RequestDelegate next,
        ILogger<RequestLoggingTimingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    // NOTE: IRequestLogWriter is resolved per-request (scoped) here
    public async Task Invoke(HttpContext context, IRequestLogWriter logWriter)
    {
        var startUtc = DateTime.UtcNow;
        var sw = Stopwatch.StartNew();

        await _next(context);

        sw.Stop();
        var endUtc = DateTime.UtcNow;

        string? idRaw =
            context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value ??
            context.User?.FindFirst("uid")?.Value ??
            context.User?.FindFirst("sub")?.Value;

        int? userId = null;
        if (int.TryParse(idRaw, out var parsed)) userId = parsed;

        var msg = $"{context.Request.Method} {context.Request.Path} -> {context.Response.StatusCode} in {sw.ElapsedMilliseconds} ms";

        try
        {
            await logWriter.WriteAsync(userId, msg, startUtc, endUtc);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to persist request log to DB");
        }

        var userName = context.User?.Identity?.IsAuthenticated == true ? context.User.Identity?.Name : "anonymous";
        _logger.LogInformation("{Method} {Path} by {User} -> {Status} in {Elapsed} ms",
            context.Request.Method, context.Request.Path, userName, context.Response.StatusCode, sw.ElapsedMilliseconds);
    }
}
