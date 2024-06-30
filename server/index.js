const express = require('express');
const axios = require('axios');
const crypto = require('crypto');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(bodyParser.json());
app.use(cors());

const pool = new Pool({
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    database: process.env.PGDATABASE,
    port: 5432,
    host: process.env.PGHOST,
    ssl: { rejectUnauthorized: false },
});

const merchantId = 'M1N7YIUDDP8L';
const merchantKey = 'e77acd71-581a-4a4b-a19b-73599b654568';
const salt = 1;

app.post('/api/payment', async (req, res) => {
    const { orderId, name, email, mobile, amount } = req.body;
    const mertrid = `CMS${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    const usrid = `CMS${Math.floor(100000 + Math.random() * 900000)}`;
    const description = 'Payment for Product';

    const data = {
        merchantId,
        merchantTransactionId: mertrid,
        merchantUserId: usrid,
        amount: amount * 100,
        redirectUrl: 'https://testing-w1tu.vercel.app/paymentstatus',
        redirectMode: 'POST',
        callbackUrl: 'https://testing-w1tu.vercel.app/paymentstatus', // Change to your domain
        merchantOrderId: orderId,
        mobileNumber: mobile,
        message: description,
        shortName: name,
        email,
        paymentInstrument: {
            type: 'PAY_PAGE',
        },
    };

    const payloadMain = Buffer.from(JSON.stringify(data)).toString('base64');
    const payload = `${payloadMain}/pg/v1/pay${merchantKey}`;
    const checksum = `${crypto.createHash('sha256').update(payload).digest('hex')}###${salt}`;

    try {
        const response = await axios.post('https://api.phonepe.com/apis/hermes/pg/v1/pay', {
            request: payloadMain,
        }, {
            headers: {
                'Content-Type': 'application/json',
                'X-VERIFY': checksum,
                accept: 'application/json',
            },
        });

        const redirectUrl = response.data.data.instrumentResponse.redirectInfo.url;
        res.json({ redirectUrl });
    } catch (error) {
        res.status(500).json({ error: 'Payment error' });
    }
});

app.post('/api/payment/status', async (req, res) => {
    const { code, merchantOrderId } = req.body;
    const orderStatus = code || 'Awaiting Payment';

    try {
        const result = await pool.query('SELECT * FROM newsales WHERE orderid = $1', [merchantOrderId]);
        if (result.rows.length === 0) {
            return res.status(400).json({ status: 'Invalid Data', orderDetails: null });
        }

        const order = result.rows[0];
        const orderDetails = {
            orderId: order.cartid,
            customerName: order.custname,
            itemCount: order.item_count,
            totalAmount: order.totamt,
            address: order.address,
            district: order.ddistrict,
            state: order.dstate,
            country: order.dcountry,
            mobile: order.dmobile,
            email: order.custid,
        };

        await pool.query('UPDATE newsales SET orderstatus = $1 WHERE orderid = $2', [orderStatus, merchantOrderId]);

        res.json({ status: orderStatus, orderDetails });
    } catch (error) {
        res.status(500).json({ error: 'Error fetching payment status' });
    }
});

app.use(express.static(path.join(__dirname, '..', 'payment-project', 'dist')));

app.get('/api/test', (req, res) => {
    res.send('Hello from the backend!');
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'payment-project', 'dist', 'index.html'));
});

app.listen(5000, () => {
    console.log('Server is running on port 5000');
});
