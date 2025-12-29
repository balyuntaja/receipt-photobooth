# Frontend Payment Gateway Implementation Guide (React)

Panduan lengkap untuk mengintegrasikan payment gateway Duitku di frontend React.

## 📋 API Endpoints

### 1. Create Payment (QRIS)
```
POST /api/payment/qris
```

**Request Body:**
```json
{
  "amount": 10000,
  "orderId": "ORDER-12345"
}
```

**Response Success:**
```json
{
  "success": true,
  "qrString": "00020101021226650016COM.DUITKU.WWW011893600914...",
  "reference": "REF-12345"
}
```

**Response Error:**
```json
{
  "success": false,
  "message": "Error message"
}
```

---

## 🚀 Implementasi React

### Option 1: Custom Hook (Recommended)

#### 1. Buat Custom Hook: `usePayment.js`

```javascript
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
      const response = await axios.post(
        `${API_BASE_URL}/api/payment/qris`,
        {
          amount,
          orderId
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
```

---

### Option 2: Service Function

#### 1. Buat Service: `paymentService.js`

```javascript
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
  }
};
```

---

## 🎨 React Components

### Component 1: Payment Form Component

```jsx
import React, { useState } from 'react';
import { usePayment } from '../hooks/usePayment';
import QRCode from 'qrcode.react'; // npm install qrcode.react

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
    <div className="payment-form">
      {!paymentData ? (
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="amount">Amount (Rupiah)</label>
            <input
              type="number"
              id="amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="1"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="orderId">Order ID</label>
            <input
              type="text"
              id="orderId"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              required
              disabled={loading}
              maxLength={100}
            />
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <button type="submit" disabled={loading}>
            {loading ? 'Creating Payment...' : 'Create Payment'}
          </button>
        </form>
      ) : (
        <div className="payment-success">
          <h3>Scan QR Code to Pay</h3>
          
          <div className="qr-code-container">
            <QRCode value={paymentData.qrString} size={256} />
          </div>

          <div className="payment-info">
            <p><strong>Reference:</strong> {paymentData.reference}</p>
            <p><strong>Order ID:</strong> {orderId}</p>
            <p><strong>Amount:</strong> Rp {amount.toLocaleString('id-ID')}</p>
          </div>

          <div className="payment-actions">
            <button onClick={handleReset}>Create New Payment</button>
            <button onClick={() => onPaymentSuccess?.(paymentData)}>
              I've Paid
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentForm;
```

---

### Component 2: Payment Status Checker

```jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const PaymentStatusChecker = ({ orderId, onPaymentConfirmed }) => {
  const [status, setStatus] = useState('pending');
  const [checking, setChecking] = useState(false);

  // Polling untuk check payment status
  // Note: Backend callback akan handle update status
  // Ini hanya untuk UI feedback
  const checkPaymentStatus = async () => {
    setChecking(true);
    try {
      // Jika Anda punya endpoint untuk check status
      // const response = await axios.get(`${API_BASE_URL}/api/payment/status/${orderId}`);
      // setStatus(response.data.status);
      
      // Atau gunakan WebSocket untuk real-time update
      console.log('Checking payment status for:', orderId);
    } catch (error) {
      console.error('Error checking payment status:', error);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    if (orderId) {
      // Poll setiap 5 detik
      const interval = setInterval(checkPaymentStatus, 5000);
      return () => clearInterval(interval);
    }
  }, [orderId]);

  return (
    <div className="payment-status">
      <p>Payment Status: <strong>{status}</strong></p>
      {checking && <p>Checking...</p>}
    </div>
  );
};

export default PaymentStatusChecker;
```

---

### Component 3: Complete Payment Flow

```jsx
import React, { useState } from 'react';
import { usePayment } from '../hooks/usePayment';
import QRCode from 'qrcode.react';

const PaymentFlow = () => {
  const [step, setStep] = useState('form'); // 'form' | 'qr' | 'success' | 'error'
  const [amount, setAmount] = useState('');
  const [orderId] = useState(`ORDER-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  const { createPayment, loading, error, paymentData } = usePayment();

  const handleCreatePayment = async () => {
    if (!amount || amount <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    try {
      await createPayment(Number(amount), orderId);
      setStep('qr');
    } catch (err) {
      setStep('error');
    }
  };

  const handlePaymentSuccess = () => {
    // Redirect atau update UI setelah payment confirmed
    setStep('success');
  };

  return (
    <div className="payment-flow">
      {step === 'form' && (
        <div className="payment-form-step">
          <h2>Create Payment</h2>
          <input
            type="number"
            placeholder="Amount (Rupiah)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min="1"
          />
          <p>Order ID: {orderId}</p>
          <button onClick={handleCreatePayment} disabled={loading}>
            {loading ? 'Creating...' : 'Create Payment'}
          </button>
          {error && <div className="error">{error}</div>}
        </div>
      )}

      {step === 'qr' && paymentData && (
        <div className="payment-qr-step">
          <h2>Scan QR Code</h2>
          <QRCode value={paymentData.qrString} size={300} />
          <p>Reference: {paymentData.reference}</p>
          <p>Amount: Rp {Number(amount).toLocaleString('id-ID')}</p>
          <button onClick={handlePaymentSuccess}>
            I've Completed Payment
          </button>
        </div>
      )}

      {step === 'success' && (
        <div className="payment-success-step">
          <h2>Payment Successful!</h2>
          <p>Your payment is being processed.</p>
        </div>
      )}

      {step === 'error' && (
        <div className="payment-error-step">
          <h2>Payment Failed</h2>
          <p>{error}</p>
          <button onClick={() => setStep('form')}>Try Again</button>
        </div>
      )}
    </div>
  );
};

export default PaymentFlow;
```

---

## 📦 Dependencies

Install required packages:

```bash
npm install axios qrcode.react
# atau
yarn add axios qrcode.react
```

---

## 🔧 Environment Variables

Buat file `.env` di root project React:

```env
REACT_APP_API_URL=http://localhost:5000
# atau untuk production
REACT_APP_API_URL=https://your-api-domain.com
```

---

## 🎯 Best Practices

### 1. Error Handling

```javascript
const handlePayment = async () => {
  try {
    const result = await createPayment(amount, orderId);
    // Success handling
  } catch (error) {
    // Show user-friendly error message
    if (error.message.includes('Network error')) {
      alert('Connection problem. Please check your internet.');
    } else if (error.message.includes('amount')) {
      alert('Invalid amount. Please enter a valid number.');
    } else {
      alert('Payment creation failed. Please try again.');
    }
  }
};
```

### 2. Loading States

```jsx
{loading && (
  <div className="loading">
    <Spinner />
    <p>Creating payment...</p>
  </div>
)}
```

### 3. Input Validation

```javascript
const validateAmount = (amount) => {
  const num = Number(amount);
  if (isNaN(num) || num <= 0) {
    return 'Amount must be greater than 0';
  }
  if (num < 10000) {
    return 'Minimum amount is Rp 10,000';
  }
  return null;
};
```

### 4. Order ID Generation

```javascript
// Generate unique order ID
const generateOrderId = () => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9);
  return `ORDER-${timestamp}-${random}`;
};
```

### 5. QR Code Display

```jsx
import QRCode from 'qrcode.react';

// Basic usage
<QRCode value={qrString} size={256} />

// With error correction
<QRCode 
  value={qrString} 
  size={256}
  level="H" // Error correction level: L, M, Q, H
  includeMargin={true}
/>

// Download QR as image
const downloadQR = () => {
  const canvas = document.getElementById('qrcode');
  const url = canvas.toDataURL();
  const link = document.createElement('a');
  link.download = 'qrcode.png';
  link.href = url;
  link.click();
};
```

---

## 🔄 Payment Flow

```
1. User enters amount
   ↓
2. Frontend calls POST /api/payment/qris
   ↓
3. Backend creates payment, returns QR string
   ↓
4. Frontend displays QR code
   ↓
5. User scans QR and pays
   ↓
6. Duitku sends callback to backend
   ↓
7. Backend updates payment status
   ↓
8. Frontend polls or receives notification
   ↓
9. Show success message
```

---

## 🎨 Styling Example (CSS)

```css
.payment-form {
  max-width: 500px;
  margin: 0 auto;
  padding: 20px;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

.form-group input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
}

.error-message {
  color: red;
  margin: 10px 0;
  padding: 10px;
  background-color: #fee;
  border-radius: 4px;
}

.qr-code-container {
  display: flex;
  justify-content: center;
  margin: 20px 0;
  padding: 20px;
  background: white;
  border-radius: 8px;
}

.payment-info {
  margin: 20px 0;
  padding: 15px;
  background: #f5f5f5;
  border-radius: 4px;
}

button {
  padding: 12px 24px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
}

button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

button:hover:not(:disabled) {
  background: #0056b3;
}
```

---

## 🧪 Testing

### Test dengan Mock Data

```javascript
// Mock payment service untuk testing
export const mockPaymentService = {
  createQrisPayment: async (amount, orderId) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          qrString: '00020101021226650016COM.DUITKU.WWW011893600914...',
          reference: `REF-${Date.now()}`
        });
      }, 1000);
    });
  }
};
```

---

## 📱 Mobile Considerations

### React Native (jika menggunakan React Native)

```javascript
import QRCode from 'react-native-qrcode-svg';

<QRCode
  value={qrString}
  size={200}
/>
```

---

## 🔐 Security Notes

1. **Jangan simpan API key di frontend** - API key harus di backend saja
2. **Validate input di frontend** - Tapi tetap validate di backend juga
3. **HTTPS wajib** - Untuk production, pastikan menggunakan HTTPS
4. **Jangan expose sensitive data** - Jangan log payment data di console production

---

## 📝 Checklist Implementasi

- [ ] Install dependencies (`axios`, `qrcode.react`)
- [ ] Setup environment variables
- [ ] Create custom hook atau service
- [ ] Create payment form component
- [ ] Add QR code display
- [ ] Add error handling
- [ ] Add loading states
- [ ] Test payment flow
- [ ] Add styling
- [ ] Test error scenarios

---

## 🆘 Troubleshooting

### Error: "Network error"
- Check API URL di environment variables
- Check CORS settings di backend
- Check network connection

### Error: "amount dan orderId wajib"
- Pastikan mengirim `amount` dan `orderId` di request body
- Pastikan `amount` adalah number, bukan string

### QR Code tidak muncul
- Check apakah `qrString` ada di response
- Check apakah QR code library sudah terinstall
- Check console untuk error messages

---

## 📚 Referensi

- [Axios Documentation](https://axios-http.com/)
- [QRCode.react Documentation](https://www.npmjs.com/package/qrcode.react)
- [Duitku API Documentation](https://docs.duitku.com/)

---

**Catatan:** Pastikan backend sudah running dan environment variables sudah di-set dengan benar sebelum testing.

