const crypto = require('crypto');
const axios = require('axios');
const uniqid = require('uniqid');

const PHONE_PE_HOST_URL = "https://api.phonepe.com/apis/hermes";
const SALT_INDEX = 1;
const SALT_KEY = "e77acd71-581a-4a4b-a19b-73599b654568";
const MERCHANT_ID = "M1N7YIUDDP8L";
const APP_BE_URL = "https://your-vercel-app-url.vercel.app";

module.exports = async (req, res) => {
    const { method, query, params, body } = req;

    if (method === 'GET') {
        if (req.url === '/') {
            res.end('Hello World!');
        } else if (req.url === '/pay') {
            // Handle payment initiation
            const amount = +query.amount;
            let userId = "MUID123";
            let merchantTransactionId = uniqid();
            let normalPayLoad = {
                merchantId: MERCHANT_ID,
                merchantTransactionId: merchantTransactionId,
                merchantUserId: userId,
                amount: amount * 100,
                redirectUrl: `${APP_BE_URL}/payment/validate/${merchantTransactionId}`,
                redirectMode: "REDIRECT",
                mobileNumber: "9999999999",
                paymentInstrument: {
                    type: "PAY_PAGE",
                },
            };

            let bufferObj = Buffer.from(JSON.stringify(normalPayLoad), "utf8");
            let base64EncodedPayload = bufferObj.toString("base64");

            let string = base64EncodedPayload + "/pg/v1/pay" + SALT_KEY;
            let sha256_val = sha256(string);
            let xVerifyChecksum = sha256_val + "###" + SALT_INDEX;

            try {
                const response = await axios.post(
                    `${PHONE_PE_HOST_URL}/pg/v1/pay`,
                    { request: base64EncodedPayload },
                    {
                        headers: {
                            "Content-Type": "application/json",
                            "X-VERIFY": xVerifyChecksum,
                            accept: "application/json",
                        },
                    }
                );

                res.writeHead(302, { 'Location': response.data.data.instrumentResponse.redirectInfo.url });
                res.end();
            } catch (error) {
                res.statusCode = 500;
                res.end(error.message);
            }
        } else if (req.url.startsWith('/payment/validate/')) {
            // Handle payment validation/status
            const merchantTransactionId = params.merchantTransactionId;

            if (!merchantTransactionId) {
                res.statusCode = 400;
                res.end("Merchant Transaction ID is required.");
                return;
            }

            let statusUrl = `${PHONE_PE_HOST_URL}/pg/v1/status/${MERCHANT_ID}/${merchantTransactionId}`;
            let string = `/pg/v1/status/${MERCHANT_ID}/${merchantTransactionId}${SALT_KEY}`;
            let sha256_val = sha256(string);
            let xVerifyChecksum = sha256_val + "###" + SALT_INDEX;

            try {
                const response = await axios.get(statusUrl, {
                    headers: {
                        "Content-Type": "application/json",
                        "X-VERIFY": xVerifyChecksum,
                        "X-MERCHANT-ID": merchantTransactionId,
                        accept: "application/json",
                    },
                });

                if (response.data && response.data.code === "PAYMENT_SUCCESS") {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify(response.data));
                } else {
                    res.statusCode = 200;
                    res.end("Payment status: " + response.data.status);
                }
            } catch (error) {
                res.statusCode = 500;
                res.end(error.message);
            }
        } else {
            res.statusCode = 404;
            res.end("Not Found");
        }
    } else {
        res.statusCode = 405;
        res.end("Method Not Allowed");
    }
};
