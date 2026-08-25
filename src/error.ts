/**
 * Custom error class for MARC record validation failures.
 * Carries the original validation results for inspection.
 */
export default class MarcRecordError extends Error {
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

function formMessage(message: string, validationResults: unknown): string {
  const firstError = getFirstError(validationResults);
  if (firstError !== undefined) {
    return `${message}: ${firstError}`;
  }

  return message;
}

/**
 * Extract the first error entry from a jsonschema validation results object.
 * Returns undefined when the value is not a validation results object
 * or its errors array is empty.
 * @param validationResults - Value to inspect.
 * @returns The first error entry, or undefined.
 */
function getFirstError(validationResults: unknown): unknown {
  if (typeof validationResults !== 'object' || validationResults === null || !('errors' in validationResults)) {
    return undefined;
  }

  const {errors} = validationResults;
  if (!Array.isArray(errors) || errors.length === 0) {
    return undefined;
  }

  return errors[0];
}
