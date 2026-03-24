// MOCK M-PESA MODULE (Offline Simulation)
// This pretends to be Safaricom so your server doesn't crash.

exports.triggerSTKPush = async (phone, amount, reference) => {
    console.log(`📲 [M-PESA MOCK] Simulating STK Push to ${phone} for KES ${amount}`);
    
    // 1. Simulate a short network delay (0.5 seconds)
    await new Promise(resolve => setTimeout(resolve, 500));

    // 2. Return a fake "Success" response exactly like Safaricom would
    return {
        MerchantRequestID: "MOCK-" + Date.now(),
        CheckoutRequestID: "ws_CO_" + Date.now(),
        ResponseCode: "0",
        ResponseDescription: "Success. Request accepted for processing",
        CustomerMessage: "Success. Request accepted for processing"
    };
};