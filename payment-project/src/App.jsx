import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import PaymentForm from "./components/PaymentForm";
import PaymentStatus from "./components/PaymentStatus";
export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<PaymentForm />} />
        <Route path="/paymentstatus" element={<PaymentStatus />} />
      </Routes>
    </Router>
  );
}
