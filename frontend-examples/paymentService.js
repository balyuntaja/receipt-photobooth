/**
 * Payment Service (Alternative to Hook)
 * 
 * Usage:
 * import { paymentService } from './paymentService';
 * const result = await paymentService.createQrisPayment(10000, 'ORDER-123');
 */

import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export const paymentService = {
  /**
   * Create QRIS payment
   * @param {number} amount - Payment amount
   * @param {string} orderId - Unique order ID
   * @returns {Promise<Object>} Payment response with QR string
   */
  createQrisPayment: async (amount, orderId) => {
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
        return response.data;
      } else {
        throw new Error(response.data.message || 'Payment creation failed');
      }
    } catch (error) {
      // Handle different error types
      if (error.response) {
        // Server responded with error
        const message = error.response.data?.message || 'Payment creation failed';
        throw new Error(message);
      } else if (error.request) {
        // Request made but no response
        throw new Error('Network error. Please check your connection.');
      } else {
        // Something else happened
        throw error;
      }
    }
  },

  /**
   * Generate unique order ID
   * @returns {string} Unique order ID
   */
  generateOrderId: () => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `ORDER-${timestamp}-${random}`;
  },

  /**
   * Format amount to Rupiah
   * @param {number} amount - Amount to format
   * @returns {string} Formatted amount
   */
  formatRupiah: (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  }
};

