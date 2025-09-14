namespace PatientVisitManager.Api.Security;

public static class RoleNormalizer
{
    private static readonly HashSet<string> Allowed =
        new(StringComparer.OrdinalIgnoreCase) { "Admin", "Doctor", "Receptionist" };

    public static bool TryNormalize(string? input, out string normalized)
    {
        normalized = string.Empty;
        if (string.IsNullOrWhiteSpace(input)) return false;
        var trimmed = input.Trim();
        if (!Allowed.Contains(trimmed)) return false;
        if (trimmed.Equals("admin", StringComparison.OrdinalIgnoreCase)) { normalized = "Admin"; return true; }
        if (trimmed.Equals("doctor", StringComparison.OrdinalIgnoreCase)) { normalized = "Doctor"; return true; }
        if (trimmed.Equals("receptionist", StringComparison.OrdinalIgnoreCase)) { normalized = "Receptionist"; return true; }
        normalized = trimmed;
        return true;
    }
}
