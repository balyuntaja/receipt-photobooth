# Frontend Payment Examples

File-file contoh untuk implementasi payment gateway Duitku di React.

## 📁 Files

- `usePayment.js` - Custom hook untuk payment
- `PaymentForm.jsx` - Complete payment form component
- `paymentService.js` - Service function alternative

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install axios qrcode.react
# atau
yarn add axios qrcode.react
```

### 2. Setup Environment Variables

Buat file `.env` di root React project:

```env
REACT_APP_API_URL=http://localhost:5000
```

### 3. Copy Files

Copy file yang diinginkan ke project React Anda:
- `usePayment.js` → `src/hooks/usePayment.js`
- `PaymentForm.jsx` → `src/components/PaymentForm.jsx`
- `paymentService.js` → `src/services/paymentService.js`

### 4. Use in Your Component

```jsx
import PaymentForm from './components/PaymentForm';

function App() {
  const handlePaymentSuccess = (paymentData) => {
    console.log('Payment created:', paymentData);
    // Handle success (redirect, show message, etc.)
  };

  return (
    <div>
      <PaymentForm onPaymentSuccess={handlePaymentSuccess} />
    </div>
  );
}
```

## 📖 Usage Examples

### Using Custom Hook

```jsx
import { usePayment } from './hooks/usePayment';

function MyComponent() {
  const { createPayment, loading, error, paymentData } = usePayment();

  const handlePay = async () => {
    try {
      await createPayment(10000, 'ORDER-123');
      // Payment created, paymentData contains QR string
    } catch (err) {
      // Handle error
    }
  };

  return (
    <div>
      <button onClick={handlePay} disabled={loading}>
        {loading ? 'Creating...' : 'Pay'}
      </button>
      {error && <p>Error: {error}</p>}
      {paymentData && <p>QR: {paymentData.qrString}</p>}
    </div>
  );
}
```

### Using Service

```jsx
import { paymentService } from './services/paymentService';

async function handlePayment() {
  try {
    const orderId = paymentService.generateOrderId();
    const result = await paymentService.createQrisPayment(10000, orderId);
    console.log('QR String:', result.qrString);
  } catch (error) {
    console.error('Payment error:', error.message);
  }
}
```

## 🎨 Styling

File `PaymentForm.jsx` sudah include inline styles. Anda bisa:
1. Gunakan inline styles yang sudah ada
2. Pindahkan ke CSS file
3. Gunakan CSS-in-JS library (styled-components, emotion, dll)
4. Gunakan CSS framework (Tailwind, Bootstrap, dll)

## ✅ Checklist

- [ ] Install dependencies
- [ ] Setup environment variables
- [ ] Copy files ke project
- [ ] Test payment creation
- [ ] Test error handling
- [ ] Add styling sesuai design
- [ ] Test dengan backend

## 🔗 Related Documentation

Lihat `FRONTEND_PAYMENT_GUIDE.md` untuk dokumentasi lengkap.

