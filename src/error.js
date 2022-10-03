/* eslint-disable functional/no-this-expression */

export default class extends Error {

  constructor(message, validationResults) {

    function formMessage() {
      if (validationResults?.errors?.length > 0) {
        const [stack] = validationResults.errors;
        return `${message}: ${stack}`;
      }

      return message;
    }

    super(formMessage());
    this.validationResults = validationResults;
  }
}
