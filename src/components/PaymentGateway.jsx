import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, Loader2, Minus, Plus } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { usePayment } from "@/hooks/usePayment";
import { COLORS } from "@/lib/constants";
import PageLayout from "./common/PageLayout";

const PRICE_PER_PRINT = 10000;

export default function PaymentGateway() {
  const navigate = useNavigate();
  const [printCount, setPrintCount] = useState(1);
  const [orderId] = useState(`ORDER-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  const { createPayment, loading, error, paymentData, reset } = usePayment();

  // Calculate amount based on print count
  const amount = printCount * PRICE_PER_PRINT;

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await createPayment(amount, orderId);
      // Payment created successfully, QR code will be shown
    } catch (err) {
      // Error is already handled in hook
      console.error("Payment error:", err);
    }
  };

  const handleReset = () => {
    setPrintCount(1);
    reset();
  };

  const handleBack = () => {
    navigate("/");
  };

  const handlePaymentSuccess = () => {
    // Navigate to templates after successful payment with printCount
    navigate("/templates", { state: { printCount } });
  };

  const isShortScreen = typeof window !== 'undefined' && window.innerHeight < 650;
  const scale = isShortScreen ? 0.85 : 1;

  return (
    <PageLayout>
      <div className="flex items-center justify-center h-full px-4 py-4">
        <div
          className="container mx-auto max-w-2xl payment-gateway-container relative w-full"
          style={{
            transform: `scale(${scale})`,
            transformOrigin: "center",
          }}
        >
          {/* Header */}
          <div className="mb-6 payment-gateway-header">
            <Button
              variant="ghost"
              onClick={handleBack}
              className="mb-4 text-white hover:text-white/80"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <h1 className={`${isShortScreen ? 'text-2xl' : 'text-3xl'} font-bold text-white text-center`}>
              Payment Gateway
            </h1>
          </div>

          {!paymentData ? (
            <form onSubmit={handleSubmit} className="bg-primary/80 border-2 border-transparent rounded-2xl shadow-lg p-6">
              <div className="space-y-6">
                {/* Print Count Control */}
                <div className="flex flex-col items-center gap-4">
                  <label className="text-lg font-medium text-white">
                    Jumlah Print
                  </label>
                  <div className="flex items-center gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setPrintCount((prev) => Math.max(1, prev - 1))}
                      disabled={printCount <= 1 || loading}
                      className="h-12 w-12 rounded-full border-2 border-white/30 text-white bg-white/10 hover:bg-white/20 disabled:opacity-50"
                    >
                      <Minus className="h-5 w-5" />
                    </Button>
                    
                    <span className="text-4xl font-bold text-white min-w-16 text-center">
                      {printCount}
                    </span>
                    
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setPrintCount((prev) => Math.min(10, prev + 1))}
                      disabled={printCount >= 10 || loading}
                      className="h-12 w-12 rounded-full border-2 border-white/30 text-white bg-white/10 hover:bg-white/20 disabled:opacity-50"
                    >
                      <Plus className="h-5 w-5" />
                    </Button>
                  </div>
                </div>

                {/* Amount Display */}
                <div className="bg-white/10 rounded-lg p-4 text-center">
                  <p className="text-sm text-white/70 mb-2">Total Pembayaran</p>
                  <p className="text-3xl font-bold text-white">
                    Rp {amount.toLocaleString("id-ID")}
                  </p>
                  <p className="text-xs text-white/50 mt-2">
                    {printCount} print × Rp {PRICE_PER_PRINT.toLocaleString("id-ID")}
                  </p>
                </div>

                {/* <div>
                  <label htmlFor="orderId" className="block text-sm font-medium text-white mb-2">
                    Order ID
                  </label>
                  <input
                    type="text"
                    id="orderId"
                    value={orderId}
                    disabled
                    className="w-full px-4 py-2 rounded-lg border border-white/20 bg-white/10 text-white/70 cursor-not-allowed text-sm"
                  />
                </div> */}

                {error && (
                  <div className="bg-red-500/20 border border-red-500 text-red-200 p-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Payment...
                    </>
                  ) : (
                    "Create Payment"
                  )}
                </Button>
              </div>
            </form>
          ) : (
            <div className="bg-primary/80 border-2 border-transparent rounded-2xl shadow-lg p-6 text-center">
              <h3 className={`${isShortScreen ? 'text-xl' : 'text-2xl'} font-bold text-white mb-4`}>
                Scan QR Code to Pay
              </h3>

              <div className="bg-white p-4 rounded-lg border-2 border-primary/20 inline-block mb-4">
                <QRCodeSVG
                  value={paymentData.qrString}
                  size={isShortScreen ? 250 : 300}
                  level="H"
                  includeMargin={true}
                />
              </div>

              <div className="bg-white/10 rounded-lg p-4 mb-4 text-left">
                {/* <p className="text-white mb-2">
                  <strong>Reference:</strong> <span className="font-mono text-sm">{paymentData.reference}</span>
                </p>
                <p className="text-white mb-2">
                  <strong>Order ID:</strong> <span className="font-mono text-sm">{orderId}</span>
                </p> */}
                <p className="text-white mb-2">
                  <strong>Jumlah Print:</strong> {printCount}
                </p>
                <p className="text-white">
                  <strong>Amount:</strong> Rp {amount.toLocaleString("id-ID")}
                </p>
              </div>

              <div className="flex gap-4">
                <Button
                  onClick={handleReset}
                  variant="outline"
                  className="flex-1"
                  size="lg"
                >
                  Create New Payment
                </Button>
                <Button
                  onClick={handlePaymentSuccess}
                  className="flex-1"
                  size="lg"
                >
                  I've Paid
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}

