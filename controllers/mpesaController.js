const axios = require("axios");
require("dotenv").config();

exports.stkPush = async (req, res) => {
  try {
    let { phone, amount } = req.body;

    phone = phone.replace(/^0/, "254");

    const auth = Buffer.from(
      `${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`,
    ).toString("base64");

    const tokenRes = await axios.get(
      "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
      {
        headers: {
          Authorization: `Basic ${auth}`,
        },
      },
    );

    const token = tokenRes.data.access_token;

    const timestamp = new Date()
      .toISOString()
      .replace(/[-:.TZ]/g, "")
      .slice(0, 14);

    const password = Buffer.from(
      `${process.env.MPESA_SHORTCODE}${process.env.MPESA_PASSKEY}${timestamp}`,
    ).toString("base64");

    const response = await axios.post(
      "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
      {
        BusinessShortCode: process.env.MPESA_SHORTCODE,
        Password: password,
        Timestamp: timestamp,
        TransactionType: "CustomerPayBillOnline",
        Amount: amount,
        PartyA: phone,
        PartyB: process.env.MPESA_SHORTCODE,
        PhoneNumber: phone,

        CallBackURL:
          "https://ledgeless-historiographically-alethea.ngrok-free.dev/api/mpesa/callback",

        AccountReference: "Order",
        TransactionDesc: "Payment",
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      },
    );

    res.json(response.data);
  } catch (err) {
    console.error("STK PUSH ERROR:", err.response?.data || err.message);

    res.status(500).json({
      error: err.response?.data || err.message,
    });
  }
};

exports.mpesaCallback = async (req, res) => {
  try {
    console.log("M-PESA CALLBACK:", JSON.stringify(req.body, null, 2));

    const callback = req.body.Body.stkCallback;

    const resultCode = callback.ResultCode;

    if (resultCode === 0) {
      console.log("✅ Payment successful");
    } else {
      console.log("❌ Payment failed");
    }

    res.json({
      ResultCode: 0,
      ResultDesc: "Accepted",
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: err.message,
    });
  }
};
