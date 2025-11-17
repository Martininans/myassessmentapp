const { createHandler } = require('../../core/server');
const { throwAppError } = require('../../core/errors');
const { validatePaymentInstructionPayload } = require('../../core/validator');
const { appLogger, timeLogger } = require('../../core/logger');
const processPaymentInstruction = require('../../services/payment-instructions/process-payment-instruction');

module.exports = createHandler({
  path: '/payment-instructions',
  method: 'post',
  async handler(rc, helpers) {
    const body = rc.body || {};
    appLogger.info('Received /payment-instructions request', {
      accounts_count: Array.isArray(body.accounts) ? body.accounts.length : 0
    });

    const validation = validatePaymentInstructionPayload(body);

    if (!validation.valid) {
      const payload = {
        type: null,
        amount: null,
        currency: null,
        debit_account: null,
        credit_account: null,
        execute_by: null,
        status: 'failed',
        status_reason: validation.reason,
        status_code: 'SY03',
        accounts: []
      };

      throwAppError(validation.reason, {
        status: helpers.http_statuses.HTTP_400_BAD_REQUEST,
        code: 'SY03',
        data: payload
      });
    }

    const { accounts, instruction } = validation.value;
    const timer = timeLogger.start('process-payment-instruction');
    let timingMeta = {};

    try {
      const result = await processPaymentInstruction({ accounts, instruction });

      timingMeta = {
        status: result.payload.status,
        status_code: result.payload.status_code
      };

      return {
        status: result.httpStatus || helpers.http_statuses.HTTP_200_OK,
        data: result.payload
      };
    } finally {
      timer.end(timingMeta);
    }
  }
});

