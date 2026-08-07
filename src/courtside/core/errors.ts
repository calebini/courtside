export class RuleViolation extends Error {
  readonly rule: string;

  constructor(rule: string, message: string) {
    super(message);
    this.name = 'RuleViolation';
    this.rule = rule;
  }
}
