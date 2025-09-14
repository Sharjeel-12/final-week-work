namespace PatientVisitManager.Api.DTOs
{
    public class CreateRuleDto
    {
        public string RuleName { get; set; } = default!;
        public decimal RulePrice { get; set; }
    }

    public class UpdateRuleDto
    {
        public int Id { get; set; }
        public string RuleName { get; set; } = default!;
        public decimal RulePrice { get; set; }
    }
}
