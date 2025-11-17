 
function validatePaymentInstructionPayload(payload) {
  if (!isPlainObject(payload)) {
    return invalid('Payload must be a JSON object.');
  }

  const accounts = payload.accounts;
  if (!Array.isArray(accounts) || accounts.length === 0) {
    return invalid('accounts must be a non-empty array.');
  }

  for (let i = 0; i < accounts.length; i++) {
    const account = accounts[i];
    const error = validateAccount(account, i);
    if (error) {
      return invalid(error);
    }
  }

  const instruction = typeof payload.instruction === 'string' ? payload.instruction.trim() : '';
  if (instruction === '') {
    return invalid('instruction must be a non-empty string.');
  }

  return {
    valid: true,
    value: {
      accounts,
      instruction
    }
  };
}

function validateAccount(account, index) {
  if (!isPlainObject(account)) {
    return `accounts[${index}] must be an object.`;
  }

  if (typeof account.id !== 'string' || account.id.trim() === '') {
    return `accounts[${index}].id must be a non-empty string.`;
  }

  if (!isFiniteNumber(account.balance)) {
    return `accounts[${index}].balance must be a finite number.`;
  }

  if (typeof account.currency !== 'string' || account.currency.trim() === '') {
    return `accounts[${index}].currency must be a non-empty string.`;
  }

  return null;
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isFiniteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

function invalid(reason) {
  return { valid: false, reason };
}

module.exports = {
  validatePaymentInstructionPayload
};