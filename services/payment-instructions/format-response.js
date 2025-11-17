function formatResponse({
  httpStatus,
  type = null,
  amount = null,
  currency = null,
  debitAccountId = null,
  creditAccountId = null,
  executeBy = null,
  status,
  statusReason,
  statusCode,
  accounts = []
}) {
  return {
    httpStatus: httpStatus || 200,
    payload: {
      type: type || null,
      amount: amount != null ? amount : null,
      currency: currency || null,
      debit_account: debitAccountId || null,
      credit_account: creditAccountId || null,
      execute_by: executeBy || null,
      status,
      status_reason: statusReason,
      status_code: statusCode,
      accounts
    }
  };
}

module.exports = formatResponse;

