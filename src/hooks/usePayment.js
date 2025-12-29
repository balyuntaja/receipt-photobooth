/**
 * Custom Hook untuk Payment Gateway Duitku
 * 
 * Usage:
 * const { createPayment, loading, error, paymentData, reset } = usePayment();
 * await createPayment(10000, 'ORDER-123');
 */

import { useState } from 'react';
import appConfig from "../../config.json";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || appConfig.apiBaseUrl || "https://photobooth-backend-beta.vercel.app";

export const usePayment = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [paymentData, setPaymentData] = useState(null);

  const createPayment = async (amount, orderId) => {
    setLoading(true);
    setError(null);
    setPaymentData(null);

    try {
      // Validate input
      if (!amount || amount <= 0) {
        throw new Error('Amount must be greater than 0');
      }

      if (!orderId || typeof orderId !== 'string') {
        throw new Error('Order ID is required');
      }

      const response = await fetch(`${API_BASE_URL}/api/payment/qris`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: Number(amount),
          orderId: orderId.trim()
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Payment creation failed');
      }

      setPaymentData(data);
      return data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to create payment';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setError(null);
    setPaymentData(null);
  };

  return {
    createPayment,
    loading,
    error,
    paymentData,
    reset
  };
};

