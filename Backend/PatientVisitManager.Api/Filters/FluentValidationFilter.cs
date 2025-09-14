using FluentValidation;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace PatientVisitManager.Api.Filters;

public class FluentValidationFilter : IAsyncActionFilter
{
    private readonly IServiceProvider _sp;
    public FluentValidationFilter(IServiceProvider sp) => _sp = sp;

    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        foreach (var arg in context.ActionArguments.Values)
        {
            if (arg is null) continue;
            var vt = typeof(IValidator<>).MakeGenericType(arg.GetType());
            if (_sp.GetService(vt) is not IValidator validator) continue;
            var result = await validator.ValidateAsync(new ValidationContext<object>(arg));
            if (!result.IsValid)
            {
                foreach (var e in result.Errors)
                    context.ModelState.AddModelError(e.PropertyName, e.ErrorMessage);
                context.Result = new BadRequestObjectResult(new {
                    message = "Validation Failed",
                    errors = context.ModelState.ToDictionary(k => k.Key, v => v.Value!.Errors.Select(er => er.ErrorMessage).ToArray())
                });
                return;
            }
        }
        await next();
    }
}
