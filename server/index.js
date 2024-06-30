const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const axios = require('axios');
const uniqid = require('uniqid');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({
    extended: true
}));


let salt_key = 'e77acd71-581a-4a4b-a19b-73599b654568'
let merchant_id = 'M1N7YIUDDP8L'

app.get('/', (req, res) => {
    res.send("Hello World!")
})


app.post('/order', async (req, res) => {

    try {

        let merchantTransactionId = uniqid();

        const data = {
            merchantId: merchant_id,
            merchantTransactionId: merchantTransactionId,
            merchantUserId: "MUI123",
            name: req.body.name,
            amount: req.body.amount * 100,
            redirectUrl: `https://testing-rho-rose.vercel.app/status?id=${merchantTransactionId}`,
            redirectMode: "POST",
            mobileNumber: req.body.phone,
            paymentInstrument: {
                type: "PAY_PAGE"
            }
        }


        const payload = JSON.stringify(data)
        const payloadMain = Buffer.from(payload).toString('base64')
        const keyIndex = 1
        const string = payloadMain + '/pg/v1/pay' + salt_key;
        const sha256 = crypto.createHash('sha256').update(string).digest('hex');
        const checksum = sha256 + '###' + keyIndex;


        const prod_URL = "https://api.phonepe.com/apis/hermes/pg/v1/pay"
        // const prod_URL = "https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/pay"

        const options = {
            method: 'POST',
            url: prod_URL,
            headers: {
                accept: 'application/json',
                'Content-Type': 'application/json',
                'X-VERIFY': checksum
            },
            data: {
                request: payloadMain
            }
        }

        await axios(options).then(function (response) {

            console.log(response.data)
            return res.json(response.data)

        }).catch(function (error) {
            console.log(error)
        })

    } catch (error) {
        console.log(error)
    }
})

app.post('/status', async (req, res) => {

    const merchantTransactionId = req.query.id
    const merchantId = merchant_id


    const keyIndex = 1
    const string = `/pg/v1/status/${merchantId}/${merchantTransactionId}` + salt_key;
    const sha256 = crypto.createHash('sha256').update(string).digest('hex');
    const checksum = sha256 + '###' + keyIndex;


    const options = {
        method: 'GET',
        url: `https://api.phonepe.com/apis/hermes/pg/v1/status/${merchantId}/${merchantTransactionId}`,
        headers: {
            accept: 'application/json',
            'Content-Type': 'application/json',
            'X-VERIFY': checksum,
            'X-MERCHANT-ID': `${merchantId}`
        }
    }

    axios.request(options).then(function (response) {
        if (response.data.success === true) {
            console.log("Payment Success")
        } else {
            console.log("Payment Failed")
        }

    }).catch(function (error) {
        console.log(error)
    })


})


app.listen(8000, () => {
    console.log("Server is running on port 8000")
})