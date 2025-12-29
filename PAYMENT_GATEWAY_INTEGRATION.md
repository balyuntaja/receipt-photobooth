# Payment Gateway Integration Guide

Panduan lengkap untuk mengintegrasikan payment gateway Duitku (QRIS) ke dalam aplikasi Receipt Photobooth.

## 📋 Table of Contents

1. [Overview](#overview)
2. [File Structure](#file-structure)
3. [API Endpoints](#api-endpoints)
4. [Implementation Details](#implementation-details)
5. [Component Usage](#component-usage)
6. [Environment Configuration](#environment-configuration)
7. [Testing](#testing)
8. [Troubleshooting](#troubleshooting)

---

## Overview

Payment Gateway terintegrasi menggunakan Duitku API untuk QRIS payment. Flow aplikasi sekarang menjadi:

```
HomeScreen → PaymentGateway → TemplateSelection → CameraSession → PhotoSelection → PreviewPrint
```

### Features

- ✅ Create QRIS payment
- ✅ Display QR code for payment
- ✅ Payment status tracking
- ✅ Error handling
- ✅ Responsive design untuk tablet/kiosk

---

## File Structure

File-file yang telah ditambahkan/diubah:

```
src/
├── hooks/
│   └── usePayment.js              # Custom hook untuk payment API
├── components/
│   └── PaymentGateway.jsx         # Component halaman payment gateway
├── App.jsx                         # Updated routing
└── components/
    └── HomeScreen.jsx              # Updated navigation
```

---

## API Endpoints

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

## Implementation Details

### 1. Custom Hook: `usePayment.js`

Hook ini mengelola state dan logic untuk payment:

```javascript
import { usePayment } from "@/hooks/usePayment";

const { createPayment, loading, error, paymentData, reset } = usePayment();

// Create payment
await createPayment(10000, 'ORDER-123');
```

**Return Values:**
- `createPayment(amount, orderId)` - Function untuk membuat payment
- `loading` - Boolean, true saat sedang membuat payment
- `error` - String, error message jika ada
- `paymentData` - Object, data payment setelah berhasil dibuat
- `reset()` - Function untuk reset state

**API Configuration:**
- Menggunakan `VITE_API_BASE_URL` dari environment variable
- Fallback ke `config.json` atau default URL
- Menggunakan fetch API (native, tidak perlu axios)

### 2. Component: `PaymentGateway.jsx`

Component utama untuk halaman payment gateway dengan 2 state:

1. **Form State** - User memasukkan amount
2. **QR Code State** - Menampilkan QR code untuk di-scan

**Props:**
- Tidak ada props (menggunakan router untuk navigation)

**Features:**
- Form input untuk amount
- Auto-generated Order ID
- QR Code display menggunakan `qrcode.react`
- Responsive design dengan scaling untuk layar pendek
- Error handling dan loading states
- Navigation back ke HomeScreen
- Navigation forward ke TemplateSelection setelah payment

**Styling:**
- Menggunakan Tailwind CSS
- Konsisten dengan design system aplikasi
- Responsive untuk tablet/kiosk mode

---

## Component Usage

### Basic Usage

```jsx
import PaymentGateway from "@/components/PaymentGateway";

// Di routing
<Route path="/payment" element={<PaymentGateway />} />
```

### Integration dengan Flow

1. **HomeScreen** → Navigate ke `/payment`
2. **PaymentGateway** → User membuat payment dan scan QR
3. **PaymentGateway** → User klik "I've Paid" → Navigate ke `/templates`

### Custom Hook Usage

Jika ingin menggunakan hook di component lain:

```jsx
import { usePayment } from "@/hooks/usePayment";

function MyComponent() {
  const { createPayment, loading, error, paymentData } = usePayment();
  
  const handlePayment = async () => {
    try {
      const result = await createPayment(10000, 'ORDER-123');
      console.log('Payment created:', result);
    } catch (err) {
      console.error('Payment failed:', err);
    }
  };
  
  return (
    <div>
      {loading && <p>Creating payment...</p>}
      {error && <p>Error: {error}</p>}
      {paymentData && (
        <QRCode value={paymentData.qrString} />
      )}
    </div>
  );
}
```

---

## Environment Configuration

### Environment Variables

Buat atau update file `.env` di root project:

```env
VITE_API_BASE_URL=https://your-api-domain.com
```

Atau bisa juga menggunakan `config.json`:

```json
{
  "apiBaseUrl": "https://your-api-domain.com"
}
```

**Priority:**
1. `VITE_API_BASE_URL` (environment variable)
2. `config.json` apiBaseUrl
3. Default: `https://photobooth-backend-beta.vercel.app`

### API Endpoint Format

Hook akan membuat request ke:
```
${API_BASE_URL}/api/payment/qris
```

Contoh:
- Development: `http://localhost:5000/api/payment/qris`
- Production: `https://photobooth-backend-beta.vercel.app/api/payment/qris`

---

## Testing

### Manual Testing

1. **Test Form Input:**
   - Input amount yang valid (positive number)
   - Input amount yang invalid (0, negative, empty)
   - Test error handling

2. **Test Payment Creation:**
   - Create payment dengan amount valid
   - Check loading state
   - Check QR code muncul
   - Check payment data correct

3. **Test Navigation:**
   - Back button kembali ke HomeScreen
   - "I've Paid" button navigate ke TemplateSelection

4. **Test Error Handling:**
   - Simulate network error
   - Simulate API error
   - Check error message displayed

### Mock Testing

Untuk testing tanpa backend, bisa modify `usePayment.js`:

```javascript
const createPayment = async (amount, orderId) => {
  // Mock untuk testing
  if (import.meta.env.MODE === 'development') {
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate delay
    const mockData = {
      success: true,
      qrString: '00020101021226650016COM.DUITKU.WWW011893600914...',
      reference: `REF-${Date.now()}`
    };
    setPaymentData(mockData);
    return mockData;
  }
  // ... rest of actual implementation
};
```

---

## Troubleshooting

### Error: "Network error" atau "Failed to fetch"

**Cause:** 
- API URL tidak benar
- CORS issue
- Backend tidak running

**Solution:**
1. Check `VITE_API_BASE_URL` di `.env` atau `config.json`
2. Check backend CORS settings
3. Check apakah backend API endpoint `/api/payment/qris` exists

### QR Code tidak muncul

**Cause:**
- `qrString` tidak ada di response
- QR code library tidak terinstall

**Solution:**
1. Check response data dari API
2. Pastikan `qrcode.react` sudah terinstall: `npm install qrcode.react`
3. Check console untuk error messages

### Payment created tapi tidak navigate

**Cause:**
- Router tidak configured dengan benar
- Navigation function tidak dipanggil

**Solution:**
1. Check apakah route `/payment` sudah ditambahkan di `App.jsx`
2. Check apakah `handlePaymentSuccess` dipanggil dengan benar
3. Check console untuk navigation errors

### Amount validation error

**Cause:**
- Input amount tidak valid (0, negative, bukan number)

**Solution:**
- Frontend sudah ada validation, pastikan input adalah positive number
- Backend juga harus validate amount

---

## Dependencies

Pastikan dependencies berikut sudah terinstall:

```bash
npm install qrcode.react
```

**Note:** `axios` tidak diperlukan karena menggunakan native `fetch` API.

---

## Flow Diagram

```
┌─────────────┐
│ HomeScreen  │
│  (Tap to    │
│   Start)    │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Payment    │
│  Gateway    │
│  (Form)     │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Payment    │
│  Gateway    │
│  (QR Code)  │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Template   │
│  Selection  │
└─────────────┘
```

---

## Best Practices

### 1. Error Handling

```javascript
try {
  await createPayment(amount, orderId);
} catch (err) {
  // Error sudah di-handle di hook
  // Tapi bisa tambahkan custom handling jika perlu
  console.error('Payment error:', err);
  // Show user-friendly message
}
```

### 2. Loading States

```jsx
{loading && (
  <div className="loading">
    <Loader2 className="animate-spin" />
    <p>Creating payment...</p>
  </div>
)}
```

### 3. Input Validation

Hook sudah ada validation, tapi bisa tambahkan di component:

```jsx
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

Order ID auto-generated dengan format:
```
ORDER-{timestamp}-{randomString}
```

Contoh: `ORDER-1703123456789-abc123xyz`

---

## Security Notes

1. **API Key** - Tidak disimpan di frontend, harus di backend
2. **HTTPS** - Wajib untuk production
3. **Input Validation** - Ada di frontend, tapi backend juga harus validate
4. **Error Messages** - Jangan expose sensitive data di error messages

---

## Future Enhancements

1. **Payment Status Polling** - Check payment status secara real-time
2. **Payment History** - Tampilkan history payment
3. **Multiple Payment Methods** - Support metode payment lain (e-wallet, bank transfer)
4. **Payment Timeout** - Handle payment yang timeout
5. **Payment Receipt** - Generate dan tampilkan receipt setelah payment

---

## References

- [Duitku API Documentation](https://docs.duitku.com/)
- [QRCode.react Documentation](https://www.npmjs.com/package/qrcode.react)
- Frontend Examples: `frontend-examples/FRONTEND_PAYMENT_GUIDE.md`

---

## Checklist Implementasi

- [x] Create `usePayment` hook
- [x] Create `PaymentGateway` component
- [x] Update routing di `App.jsx`
- [x] Update navigation di `HomeScreen`
- [x] Add QR code display
- [x] Add error handling
- [x] Add loading states
- [x] Add responsive design
- [x] Create documentation
- [ ] Test dengan backend API
- [ ] Test error scenarios
- [ ] Test di production environment

---

**Note:** Pastikan backend sudah running dan endpoint `/api/payment/qris` sudah tersedia sebelum testing.

