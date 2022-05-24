export default class extends Error {
  constructor(message, validationResults) {
    super(message);
    this.validationResults = validationResults; // eslint-disable-line functional/no-this-expression
  }
}
