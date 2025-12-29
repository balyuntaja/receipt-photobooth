/**
 * Custom Hook untuk Payment Gateway Duitku
 * 
 * Usage:
 * const { createPayment, loading, error, paymentData, reset } = usePayment();
 * await createPayment(10000, 'ORDER-123');
 */

import { useState } from 'react';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

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

      const response = await axios.post(
        `${API_BASE_URL}/api/payment/qris`,
        {
          amount: Number(amount),
          orderId: orderId.trim()
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        setPaymentData(response.data);
        return response.data;
      } else {
        throw new Error(response.data.message || 'Payment creation failed');
      }
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

