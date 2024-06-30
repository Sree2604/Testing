import React, { useEffect, useState } from "react";

function PaymentStatus() {
  const [status, setStatus] = useState("");
  const [orderDetails, setOrderDetails] = useState(null);

  useEffect(() => {
    const fetchPaymentStatus = async () => {
      try {
        const response = await fetch(
          "http://localhost:3000/api/payment/status",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              code: new URLSearchParams(window.location.search).get("code"),
              merchantOrderId: new URLSearchParams(window.location.search).get(
                "merchantOrderId"
              ),
            }),
          }
        );
        const data = await response.json();
        setStatus(data.status);
        setOrderDetails(data.orderDetails);
      } catch (error) {
        console.error("Error fetching payment status:", error);
      }
    };
    fetchPaymentStatus();
  }, []);

  if (!orderDetails) return <div>Loading...</div>;

  return (
    <div>
      <h3>Payment Status: {status}</h3>
      {status === "PAYMENT_SUCCESS" ? (
        <div>
          <h4>Your Order Details</h4>
          <p>Order ID: {orderDetails.orderId}</p>
          <p>Items: {orderDetails.itemCount}</p>
          <p>Bill Amount: {orderDetails.totalAmount}</p>
          <p>Delivery Details:</p>
          <p>{orderDetails.customerName}</p>
          <p>{orderDetails.address}</p>
          <p>{orderDetails.district}</p>
          <p>{orderDetails.state}</p>
          <p>{orderDetails.country}</p>
          <p>Mobile: {orderDetails.mobile}</p>
          <p>Email: {orderDetails.email}</p>
        </div>
      ) : (
        <p>Payment is pending or failed. Please contact support.</p>
      )}
      <a href="/">Back to Home</a>
    </div>
  );
}

export default PaymentStatus;
