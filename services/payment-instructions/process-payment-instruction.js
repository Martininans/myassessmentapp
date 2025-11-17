const Messages = require('../../messages/payment-instructions');
const { throwAppError } = require('../../core/errors');
const parseInstruction = require('./parse-instruction');
const validateInstruction = require('./validate-instruction');
const executeTransaction = require('./execute-transaction');
const formatResponse = require('./format-response');

const buildAccountSnapshots = executeTransaction.buildAccountSnapshots;
const { parsePositiveInteger } = validateInstruction;

async function processPaymentInstruction(serviceData = {}) {
  const accounts = Array.isArray(serviceData.accounts) ? serviceData.accounts : [];
  const instruction =
    typeof serviceData.instruction === 'string' ? serviceData.instruction : '';

  const parsed = parseInstruction(instruction);

  if (parsed.unparseable) {
    return throwResponse({
      httpStatus: 400,
      status: 'failed',
      statusCode: 'SY03',
      statusReason: Messages.SY03,
      type: null,
      amount: null,
      currency: null,
      debitAccountId: null,
      creditAccountId: null,
      executeBy: null,
      accounts: []
    });
  }

  if (parsed.error) {
    return throwResponse({
      httpStatus: 400,
      status: 'failed',
      statusCode: parsed.error,
      statusReason: Messages[parsed.error] || Messages.SY03,
      type: parsed.type || null,
      amount: extractAmountValue(parsed.amount),
      currency: parsed.currency || null,
      debitAccountId: parsed.debitAccountId || null,
      creditAccountId: parsed.creditAccountId || null,
      executeBy: parsed.onDate || null,
      accounts: buildAccountSnapshots(accounts, parsed.debitAccountId, parsed.creditAccountId)
    });
  }

  const validation = validateInstruction({
    parsed,
    accounts
  });

  if (!validation.valid) {
    return throwResponse({
      httpStatus: 400,
      status: 'failed',
      statusCode: validation.code,
      statusReason: validation.reason,
      type: parsed.type || null,
      amount: validation.amount,
      currency: validation.currency,
      debitAccountId: validation.debitAccountId,
      creditAccountId: validation.creditAccountId,
      executeBy: validation.executeBy,
      accounts: buildAccountSnapshots(accounts, validation.debitAccountId, validation.creditAccountId)
    });
  }

  const execution = executeTransaction({
    accounts,
    debitAccountId: validation.debitAccountId,
    creditAccountId: validation.creditAccountId,
    amount: validation.amount,
    executeBy: validation.executeBy
  });

  return formatResponse({
    httpStatus: execution.httpStatus,
    status: execution.status,
    statusCode: execution.statusCode,
    statusReason: execution.statusReason,
    type: parsed.type || null,
    amount: validation.amount,
    currency: validation.currency,
    debitAccountId: validation.debitAccountId,
    creditAccountId: validation.creditAccountId,
    executeBy: validation.executeBy,
    accounts: execution.accounts
  });
}

function extractAmountValue(amountStr) {
  const result = parsePositiveInteger ? parsePositiveInteger(amountStr) : { valid: false };
  return result.valid ? result.value : null;
}

function throwResponse(response) {
  const formatted = formatResponse(response);
  throwAppError(formatted.payload.status_reason, {
    status: formatted.httpStatus,
    code: formatted.payload.status_code,
    data: formatted.payload
  });
}

module.exports = processPaymentInstruction;

