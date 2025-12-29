/**
 * Payment Form Component
 * 
 * Install dependencies:
 * npm install qrcode.react axios
 * 
 * Usage:
 * <PaymentForm onPaymentSuccess={(data) => console.log(data)} />
 */

import React, { useState } from 'react';
import { usePayment } from './usePayment';
import QRCode from 'qrcode.react';

const PaymentForm = ({ onPaymentSuccess }) => {
  const [amount, setAmount] = useState('');
  const [orderId, setOrderId] = useState(`ORDER-${Date.now()}`);
  const { createPayment, loading, error, paymentData, reset } = usePayment();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!amount || amount <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    try {
      await createPayment(Number(amount), orderId);
      // Payment created successfully, QR code will be shown
    } catch (err) {
      // Error is already handled in hook
      console.error('Payment error:', err);
    }
  };

  const handleReset = () => {
    setAmount('');
    setOrderId(`ORDER-${Date.now()}`);
    reset();
  };

  return (
    <div className="payment-form" style={styles.container}>
      {!paymentData ? (
        <form onSubmit={handleSubmit} style={styles.form}>
          <h2 style={styles.title}>Create Payment</h2>
          
          <div style={styles.formGroup}>
            <label htmlFor="amount" style={styles.label}>
              Amount (Rupiah)
            </label>
            <input
              type="number"
              id="amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="1"
              required
              disabled={loading}
              style={styles.input}
              placeholder="Enter amount"
            />
          </div>

          <div style={styles.formGroup}>
            <label htmlFor="orderId" style={styles.label}>
              Order ID
            </label>
            <input
              type="text"
              id="orderId"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              required
              disabled={loading}
              maxLength={100}
              style={styles.input}
            />
          </div>

          {error && (
            <div style={styles.error}>
              {error}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            style={styles.button}
          >
            {loading ? 'Creating Payment...' : 'Create Payment'}
          </button>
        </form>
      ) : (
        <div style={styles.paymentSuccess}>
          <h3 style={styles.title}>Scan QR Code to Pay</h3>
          
          <div style={styles.qrContainer}>
            <QRCode 
              value={paymentData.qrString} 
              size={256}
              level="H"
              includeMargin={true}
            />
          </div>

          <div style={styles.paymentInfo}>
            <p><strong>Reference:</strong> {paymentData.reference}</p>
            <p><strong>Order ID:</strong> {orderId}</p>
            <p><strong>Amount:</strong> Rp {Number(amount).toLocaleString('id-ID')}</p>
          </div>

          <div style={styles.actions}>
            <button onClick={handleReset} style={styles.buttonSecondary}>
              Create New Payment
            </button>
            <button 
              onClick={() => onPaymentSuccess?.(paymentData)}
              style={styles.button}
            >
              I've Paid
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Inline styles (bisa dipindah ke CSS file)
const styles = {
  container: {
    maxWidth: '500px',
    margin: '0 auto',
    padding: '20px',
    fontFamily: 'Arial, sans-serif'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px'
  },
  title: {
    marginBottom: '20px',
    color: '#333'
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px'
  },
  label: {
    fontWeight: 'bold',
    color: '#555'
  },
  input: {
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '16px'
  },
  error: {
    color: 'red',
    padding: '10px',
    backgroundColor: '#fee',
    borderRadius: '4px',
    marginTop: '10px'
  },
  button: {
    padding: '12px 24px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '16px',
    marginTop: '10px'
  },
  buttonSecondary: {
    padding: '12px 24px',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '16px'
  },
  paymentSuccess: {
    textAlign: 'center'
  },
  qrContainer: {
    display: 'flex',
    justifyContent: 'center',
    margin: '20px 0',
    padding: '20px',
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  paymentInfo: {
    margin: '20px 0',
    padding: '15px',
    backgroundColor: '#f5f5f5',
    borderRadius: '4px',
    textAlign: 'left'
  },
  actions: {
    display: 'flex',
    gap: '10px',
    justifyContent: 'center',
    marginTop: '20px'
  }
};

export default PaymentForm;

