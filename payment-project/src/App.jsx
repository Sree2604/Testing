import React, { useState } from "react";
import axios from "axios";

const App = () => {
  const [amount, setAmount] = useState(0);

  const initiatePayment = async () => {
    try {
      const response = await axios.get(
        `https://testing-rho-rose.vercel.app/pay?amount=${amount}`
      );
      window.location.href =
        response.data.data.instrumentResponse.redirectInfo.url;
    } catch (error) {
      console.error("Error initiating payment:", error);
    }
  };

  // const checkPaymentStatus = async (merchantTransactionId) => {
  //   try {
  //     const response = await axios.get(
  //       `https://testing-rho-rose.vercel.app/payment/validate/${merchantTransactionId}`
  //     );
  //     console.log("Payment status:", response.data);
  //     // Handle payment status accordingly
  //   } catch (error) {
  //     console.error("Error checking payment status:", error);
  //   }
  // };

  return (
    <div>
      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />
      <button onClick={initiatePayment}>Initiate Payment</button>
      {/* You can provide an input field for merchantTransactionId to check payment status */}
      {/* <input type="text" onChange={(e) => checkPaymentStatus(e.target.value)} /> */}
    </div>
  );
};

export default App;
