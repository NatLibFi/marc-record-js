import type {ValidatorResult} from 'jsonschema';

/**
 * Custom error class for MARC record validation failures.
 * Carries the original validation results for inspection.
 */
export default class MarcRecordError extends Error {
  /** The raw validation results from jsonschema. */
  validationResults?: ValidatorResult;

  /**
   * Create a MarcRecordError with an optional message and validation results.
   * @param message - Error message.
   * @param validationResults - Optional validation results object.
   */
  constructor(message: string, validationResults?: ValidatorResult) {
    super(formMessage(message, validationResults));
    this.name = 'MarcRecordError'
    this.validationResults = validationResults;
  }
}

function formMessage(message: string, validationResults: ValidatorResult | undefined): string {
  const firstError = validationResults?.errors[0]?.toString();
  if (firstError !== undefined) {
    return `${message}: ${firstError}`;
  }

  return message;
}
