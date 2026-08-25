/**
 * Custom error class for MARC record validation failures.
 * Carries the original validation results for inspection.
 */
export default class extends Error {
  /** The raw validation results from jsonschema. */
  validationResults?: unknown;

  /**
   * Create a MarcRecordError with an optional message and validation results.
   * @param message - Error message.
   * @param validationResults - Optional validation results object.
   */
  constructor(message: string, validationResults?: unknown) {
    super(formMessage(message, validationResults));
    this.name = 'MarcRecordError'
    this.validationResults = validationResults;
  }
}

function formMessage(message: string, validationResults): string {
  if (validationResults?.errors?.length > 0) {
    const [stack] = validationResults.errors;
    return `${message}: ${stack}`;
  }

  return message;
}
