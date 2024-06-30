const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const axios = require('axios');
const uniqid = require('uniqid');
const sha256 = require('sha256')
const path = require('path')
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({
    extended: true
}));

app.use(express.static(path.join(__dirname, '..', 'payment-project', 'dist')));

// // All other routes should serve the React app
app.get('/client', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'payment-project', 'dist', 'index.html'));
});

app.get('/api/hello', (req, res) => {
    res.json({ message: 'Hello from server!' });
});


// const id = process.env.ID;
const PHONE_PE_HOST_URL = "https://api.phonepe.com/apis/hermes";
const SALT_INDEX = 1;
const SALT_KEY = "e77acd71-581a-4a4b-a19b-73599b654568";
const MERCHANT_ID = "M1N7YIUDDP8L";
const APP_BE_URL = "https://testing-rho-rose.vercel.app/";

app.get('/', (req, res) => {
    res.send("Hello World!")
})


app.get("/pay", async function (req, res, next) {
    // Initiate a payment

    // Transaction amount
    const amount = +req.query.amount;

    // User ID is the ID of the user present in our application DB
    let userId = "MUID123";

    // Generate a unique merchant transaction ID for each transaction
    let merchantTransactionId = uniqid();

    // redirect url => phonePe will redirect the user to this url once payment is completed. It will be a GET request, since redirectMode is "REDIRECT"
    let normalPayLoad = {
        merchantId: MERCHANT_ID, //* PHONEPE_MERCHANT_ID . Unique for each account (private)
        merchantTransactionId: merchantTransactionId,
        merchantUserId: userId,
        amount: amount * 100, // converting to paise
        redirectUrl: `${APP_BE_URL}/payment/validate/${merchantTransactionId}`,
        redirectMode: "REDIRECT",
        mobileNumber: "9999999999",
        paymentInstrument: {
            type: "PAY_PAGE",
        },
    };

    // make base64 encoded payload
    let bufferObj = Buffer.from(JSON.stringify(normalPayLoad), "utf8");
    let base64EncodedPayload = bufferObj.toString("base64");

    // X-VERIFY => SHA256(base64EncodedPayload + "/pg/v1/pay" + SALT_KEY) + ### + SALT_INDEX
    let string = base64EncodedPayload + "/pg/v1/pay" + SALT_KEY;
    let sha256_val = sha256(string);
    let xVerifyChecksum = sha256_val + "###" + SALT_INDEX;

    axios
        .post(
            `${PHONE_PE_HOST_URL}/pg/v1/pay`,
            {
                request: base64EncodedPayload,
            },
            {
                headers: {
                    "Content-Type": "application/json",
                    "X-VERIFY": xVerifyChecksum,
                    accept: "application/json",
                },
            }
        )
        .then(function (response) {
            console.log("response->", JSON.stringify(response.data));
            return res.json(response.data)
            // res.redirect(response.data.data.instrumentResponse.redirectInfo.url);
        })
        .catch(function (error) {
            res.send(error);
        });
});

// endpoint to check the status of payment
app.get("/payment/validate/:merchantTransactionId", async function (req, res) {
    const { merchantTransactionId } = req.params;
    // check the status of the payment using merchantTransactionId
    if (merchantTransactionId) {
        let statusUrl =
            `${PHONE_PE_HOST_URL}/pg/v1/status/${MERCHANT_ID}/` +
            merchantTransactionId;

        // generate X-VERIFY
        let string =
            `/pg/v1/status/${MERCHANT_ID}/` + merchantTransactionId + SALT_KEY;
        let sha256_val = sha256(string);
        let xVerifyChecksum = sha256_val + "###" + SALT_INDEX;

        axios
            .get(statusUrl, {
                headers: {
                    "Content-Type": "application/json",
                    "X-VERIFY": xVerifyChecksum,
                    "X-MERCHANT-ID": merchantTransactionId,
                    accept: "application/json",
                },
            })
            .then(function (response) {
                console.log("response->", response.data);
                if (response.data && response.data.code === "PAYMENT_SUCCESS") {
                    // redirect to FE payment success status page
                    res.send(response.data);
                } else {
                    // redirect to FE payment failure / pending status page
                }
            })
            .catch(function (error) {
                // redirect to FE payment failure / pending status page
                res.send(error);
            });
    } else {
        res.send("Sorry!! Error");
    }
});



app.listen(8000, () => {
    console.log("Server is running on port 8000")
})
