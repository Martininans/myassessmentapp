const Messages = require('../../messages/payment-instructions');

function executeTransaction({
  accounts,
  debitAccountId,
  creditAccountId,
  amount,
  executeBy
}) {
  const snapshots = buildAccountSnapshots(accounts, debitAccountId, creditAccountId);

  const pending = shouldDelayExecution(executeBy);
  if (pending) {
    return {
      status: 'pending',
      statusCode: 'AP02',
      statusReason: Messages.AP02,
      accounts: snapshots,
      httpStatus: 200
    };
  }

  for (let i = 0; i < snapshots.length; i++) {
    const account = snapshots[i];
    if (account.id === debitAccountId) {
      account.balance = account.balance_before - amount;
    } else if (account.id === creditAccountId) {
      account.balance = account.balance_before + amount;
    }
  }

  return {
    status: 'successful',
    statusCode: 'AP00',
    statusReason: Messages.AP00,
    accounts: snapshots,
    httpStatus: 200
  };
}

function shouldDelayExecution(executeBy) {
  if (!executeBy) {
    return false;
  }
  const today = currentUTCDate();
  return executeBy > today;
}

function currentUTCDate() {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const day = String(now.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function buildAccountSnapshots(accounts, debitAccountId, creditAccountId) {
  if (!Array.isArray(accounts)) return [];
  const result = [];
  for (let i = 0; i < accounts.length; i++) {
    const account = accounts[i];
    if (!account) continue;
    if (account.id === debitAccountId || account.id === creditAccountId) {
      const normalizedBalance = toNumber(account.balance);
      result.push({
        id: account.id,
        balance_before: normalizedBalance,
        balance: normalizedBalance,
        currency: normalizeCurrency(account.currency)
      });
    }
  }
  return result;
}

function toNumber(value) {
  if (typeof value === 'number') return value;
  if (value == null) return 0;
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function normalizeCurrency(value) {
  if (!value) return null;
  return String(value).toUpperCase();
}

module.exports = executeTransaction;
module.exports.buildAccountSnapshots = buildAccountSnapshots;