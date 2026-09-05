const { query } = require('../database/db');

/**
 * Service to handle interaction with payment gateways (Stripe, etc.)
 * Currently a mock implementation
 */

const createPaymentIntent = async (amount, metadata) => {
    // Mock Stripe payment intent creation
    return {
        id: `pi_${Math.random().toString(36).substr(2, 9)}`,
        amount,
        client_secret: `secret_${Math.random().toString(36).substr(2, 9)}`,
        status: 'requires_payment_method',
        metadata
    };
};

const capturePayment = async (paymentIntentId) => {
    // Mock capturing payment
    return {
        id: paymentIntentId,
        status: 'succeeded'
    };
};

/**
 * Transfer funds (Payout to expert)
 */
const transferFunds = async (amount, destinationAccountId) => {
    // Mock transfer
    return {
        id: `tr_${Math.random().toString(36).substr(2, 9)}`,
        amount,
        destination: destinationAccountId,
        status: 'paid'
    };
};

module.exports = {
    createPaymentIntent,
    capturePayment,
    transferFunds
};
