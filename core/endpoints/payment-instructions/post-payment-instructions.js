// Endpoint file named as a verb
const { createHandler } = require('../../core/server');
const paymentInstructionsService = require('../../services/payment-instructions');


module.exports = createHandler({
path: '/payment-instructions',
method: 'post',
async handler(rc, helpers) {
const payload = rc.body || {};
// attach request meta if needed
payload.request_meta = rc.properties || {};


const result = await paymentInstructionsService.run(payload);


return {
status: result.httpStatus || helpers.http_statuses.HTTP_200_OK,
data: result
};
}
});