import React, { useState, useEffect } from "react";

function PaymentForm() {
  const [orderId, setOrderId] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [amount, setAmount] = useState("");

  const [message, setMessage] = useState("");
  useEffect(() => {
    fetch("/api/test")
      .then((response) => response.text())
      .then((data) => setMessage(data));
  }, []);

  console.log(message);
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(
        "https://testing-rho-rose.vercel.app/api/payment",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            orderId,
            name,
            email,
            mobile,
            amount,
          }),
        }
      );
      const data = await response.json();
      window.location.href = data.redirectUrl;
      console.log(data.redirectUrl);
    } catch (error) {
      console.error("Payment error:", error);
    }
  };

  return <>{message}</>;
}

export default PaymentForm;
