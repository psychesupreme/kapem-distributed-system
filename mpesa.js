/**
 * KAPEM PAYMENT GATEWAY
 * Integration: Safaricom Daraja API (STK Push)
 * Protocol: REST / OAuth 2.0
 */

const https = require('https');

class MpesaService {
    constructor() {
        // ⚠️ REPLACE THESE WITH YOUR SANDBOX KEYS FROM DEVELOPER.SAFARICOM.CO.KE
        this.consumerKey = "pY0L3D2ewMcC5kI0AHEK0LHksCoWsfCdAsuPRB0JvUH0JTl2"; 
        this.consumerSecret = "zFX18fptHFBG4BIW0subTufCIhUDUt5AMXObYCtuE1c4GLcQUtyCKWD1auexLxIU"; 
        
        // Default Sandbox Settings (Do not change for test)
        this.shortCode = "174379"; 
        this.passkey = "bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919";
        this.baseUrl = "sandbox.safaricom.co.ke";
    }

    // 1. GENERATE OAUTH TOKEN
    async getAccessToken() {
        return new Promise((resolve, reject) => {
            const auth = Buffer.from(`${this.consumerKey}:${this.consumerSecret}`).toString('base64');
            const options = {
                hostname: this.baseUrl,
                path: '/oauth/v1/generate?grant_type=client_credentials',
                method: 'GET',
                headers: { 'Authorization': `Basic ${auth}` }
            };

            const req = https.request(options, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    const json = JSON.parse(data);
                    if (json.access_token) resolve(json.access_token);
                    else reject(new Error("Failed to get M-Pesa Token: " + JSON.stringify(json)));
                });
            });
            req.on('error', (e) => reject(e));
            req.end();
        });
    }

    // 2. SEND STK PUSH
    async triggerSTKPush(phoneNumber, amount, reference) {
        console.log(`📲 Initiating STK Push to ${phoneNumber} for KES ${amount}...`);
        try {
            const token = await this.getAccessToken();
            
            // Timestamp format: YYYYMMDDHHmmss
            const date = new Date();
            const timestamp = date.toISOString().replace(/[^0-9]/g, '').slice(0, 14);
            const password = Buffer.from(`${this.shortCode}${this.passkey}${timestamp}`).toString('base64');

            const payload = JSON.stringify({
                "BusinessShortCode": this.shortCode,
                "Password": password,
                "Timestamp": timestamp,
                "TransactionType": "CustomerPayBillOnline",
                "Amount": 1, // FORCE 1 KES FOR SANDBOX TESTING
                "PartyA": phoneNumber, 
                "PartyB": this.shortCode, 
                "PhoneNumber": phoneNumber,
                "CallBackURL": "https://mydomain.com/callback", // Not used in localhost
                "AccountReference": "KAPEM Market",
                "TransactionDesc": `Payment for ${reference}`
            });

            return new Promise((resolve, reject) => {
                const options = {
                    hostname: this.baseUrl,
                    path: '/mpesa/stkpush/v1/processrequest',
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                        'Content-Length': payload.length
                    }
                };

                const req = https.request(options, (res) => {
                    let data = '';
                    res.on('data', chunk => data += chunk);
                    res.on('end', () => {
                        const response = JSON.parse(data);
                        resolve(response);
                    });
                });
                req.write(payload);
                req.end();
            });

        } catch (err) {
            console.error("❌ M-Pesa Module Error:", err.message);
            // FALLBACK FOR DEMO if keys are missing
            return { ResponseCode: "0", CheckoutRequestID: "DEMO-MOCK-" + Date.now() };
        }
    }
}

module.exports = new MpesaService();