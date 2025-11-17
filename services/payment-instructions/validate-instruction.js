const Messages = require('../../messages/payment-instructions');

const SUPPORTED_CURRENCIES = ['NGN', 'USD', 'GBP', 'GHS'];

function validateInstruction({ parsed, accounts }) {
  const accountList = Array.isArray(accounts) ? accounts : [];
  const context = {
    amount: null,
    currency: null,
    debitAccountId: parsed.debitAccountId || null,
    creditAccountId: parsed.creditAccountId || null,
    executeBy: parsed.onDate || null
  };

  const amountCheck = parsePositiveInteger(parsed.amount);
  if (!amountCheck.valid) {
    context.amount = null;
    return fail('AM01', Messages.AM01, context);
  }
  context.amount = amountCheck.value;

  const normalizedCurrency = normalizeCurrency(parsed.currency);
  context.currency = normalizedCurrency;
  if (!normalizedCurrency) {
    return fail('CU02', Messages.CU02, context);
  }

  if (!isSupportedCurrency(normalizedCurrency)) {
    return fail('CU02', Messages.CU02, context);
  }

  if (!isValidAccountId(context.debitAccountId)) {
    return fail('AC04', Messages.AC04, context);
  }

  if (!isValidAccountId(context.creditAccountId)) {
    return fail('AC04', Messages.AC04, context);
  }

  if (context.debitAccountId === context.creditAccountId) {
    return fail('AC02', Messages.AC02, context);
  }

  const debitAccount = findAccount(accountList, context.debitAccountId);
  if (!debitAccount) {
    return fail(
      'AC03',
      `${Messages.AC03}: ${context.debitAccountId || 'debit account'}`,
      context
    );
  }

  const creditAccount = findAccount(accountList, context.creditAccountId);
  if (!creditAccount) {
    return fail(
      'AC03',
      `${Messages.AC03}: ${context.creditAccountId || 'credit account'}`,
      context
    );
  }

  const debitCurrency = normalizeCurrency(debitAccount.currency);
  const creditCurrency = normalizeCurrency(creditAccount.currency);

  if (!debitCurrency || !creditCurrency) {
    return fail('CU01', Messages.CU01, context);
  }

  if (debitCurrency !== creditCurrency) {
    return fail(
      'CU01',
      `${Messages.CU01}: ${debitAccount.id}=${debitCurrency}, ${creditAccount.id}=${creditCurrency}`,
      context
    );
  }

  if (debitCurrency !== normalizedCurrency) {
    return fail(
      'CU01',
      `${Messages.CU01}: instruction currency ${normalizedCurrency} differs from account currency ${debitCurrency}`,
      context
    );
  }

  let normalizedExecuteBy = null;
  if (context.executeBy) {
    const dateCheck = validateDate(context.executeBy);
    if (!dateCheck.valid) {
      context.executeBy = null;
      return fail('DT01', Messages.DT01, context);
    }
    normalizedExecuteBy = dateCheck.value;
  }
  context.executeBy = normalizedExecuteBy;

  const debitBalance = toNumber(debitAccount.balance);
  const creditBalance = toNumber(creditAccount.balance);

  if (!Number.isFinite(debitBalance)) {
    return fail(
      'AC03',
      `${Messages.AC03}: invalid balance for debit account`,
      context
    );
  }

  if (!Number.isFinite(creditBalance)) {
    return fail(
      'AC03',
      `${Messages.AC03}: invalid balance for credit account`,
      context
    );
  }

  if (debitBalance < context.amount) {
    return fail(
      'AC01',
      `${Messages.AC01}: ${debitAccount.id} has ${debitBalance}, needs ${context.amount}`,
      context
    );
  }

  return {
    valid: true,
    amount: context.amount,
    currency: context.currency,
    debitAccountId: context.debitAccountId,
    creditAccountId: context.creditAccountId,
    executeBy: context.executeBy,
    debitAccount,
    creditAccount
  };
}

function fail(code, defaultReason, context) {
  return {
    valid: false,
    code,
    reason: defaultReason || Messages[code] || 'Validation error',
    amount: context.amount,
    currency: context.currency,
    debitAccountId: context.debitAccountId,
    creditAccountId: context.creditAccountId,
    executeBy: context.executeBy
  };
}

function parsePositiveInteger(value) {
  if (value == null) {
    return { valid: false };
  }

  const str = String(value).trim();
  if (str === '') {
    return { valid: false };
  }

  let result = 0;
  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    if (ch < '0' || ch > '9') {
      return { valid: false };
    }
    result = result * 10 + (ch.charCodeAt(0) - 48);
  }

  if (result <= 0) {
    return { valid: false };
  }

  return { valid: true, value: result };
}

function normalizeCurrency(currency) {
  if (!currency) return null;
  return String(currency).trim().toUpperCase();
}

function isSupportedCurrency(currency) {
  return SUPPORTED_CURRENCIES.indexOf(currency) !== -1;
}

function isValidAccountId(id) {
  if (!id || typeof id !== 'string') return false;
  for (let i = 0; i < id.length; i++) {
    const ch = id[i];
    if (!isAllowedAccountChar(ch)) {
      return false;
    }
  }
  return true;
}

function isAllowedAccountChar(ch) {
  const code = ch.charCodeAt(0);
  if (code >= 48 && code <= 57) return true; // 0-9
  if (code >= 65 && code <= 90) return true; // A-Z
  if (code >= 97 && code <= 122) return true; // a-z
  return ch === '-' || ch === '.' || ch === '@';
}

function findAccount(accounts, id) {
  for (let i = 0; i < accounts.length; i++) {
    const account = accounts[i];
    if (account && account.id === id) {
      return account;
    }
  }
  return null;
}

function validateDate(value) {
  if (!value || typeof value !== 'string') {
    return { valid: false };
  }

  const trimmed = value.trim();
  if (trimmed.length !== 10) {
    return { valid: false };
  }

  if (trimmed[4] !== '-' || trimmed[7] !== '-') {
    return { valid: false };
  }

  const yearStr = trimmed.substring(0, 4);
  const monthStr = trimmed.substring(5, 7);
  const dayStr = trimmed.substring(8, 10);

  if (!(allDigits(yearStr) && allDigits(monthStr) && allDigits(dayStr))) {
    return { valid: false };
  }

  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);

  if (month < 1 || month > 12) return { valid: false };
  if (day < 1 || day > 31) return { valid: false };

  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return { valid: false };
  }

  return { valid: true, value: trimmed };
}

function allDigits(str) {
  if (!str) return false;
  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    if (ch < '0' || ch > '9') {
      return false;
    }
  }
  return true;
}

function toNumber(value) {
  if (typeof value === 'number') {
    return value;
  }
  if (value == null) return NaN;
  const num = Number(value);
  return Number.isFinite(num) ? num : NaN;
}

module.exports = validateInstruction;
module.exports.parsePositiveInteger = parsePositiveInteger;

