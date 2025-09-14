namespace PatientVisitManager.Api.Models
{
    public class Rule
    {
        public int Id { get; set; }
        public string RuleName { get; set; } = default!;
        public decimal RulePrice { get; set; }
    }

}
