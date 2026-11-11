import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { PayPalButtons, PayPalScriptProvider } from "@paypal/react-paypal-js";
import Layout from "../components/common/Layout";
import {
  getMilestone,
  createPayPalOrder,
  capturePayPalOrder
} from "../services/paymentService";

export default function PaymentPage() {
  const { milestoneId } = useParams();
  const [milestone, setMilestone] = useState(null);
  const [message, setMessage] = useState("Loading...");

  useEffect(() => {
    async function load() {
      try {
        const data = await getMilestone(milestoneId);
        setMilestone(data);
        setMessage("");
      } catch (error) {
        setMessage(error.message);
      }
    }

    load();
  }, [milestoneId]);

  if (!milestone) {
    return (
      <Layout>
        <p>{message}</p>
      </Layout>
    );
  }

  const amount = (milestone.amountMinor / 100).toFixed(2);

  return (
    <Layout>
      <header className="page-header">
        <div>
          <h1>{milestone.title}</h1>
          <p>Secure PayPal payment</p>
        </div>
      </header>

      <section className="panel" style={{ maxWidth: 480 }}>
        <div
          className="card"
          style={{ border: 0, padding: 0, marginBottom: 20 }}
        >
          <div className="label">Amount due</div>
          <div className="value navy">{amount} USD</div>
        </div>

        {milestone.status === "PAID" ? (
          <p className="pill pill-paid" style={{ padding: "8px 14px" }}>
            This milestone has already been paid
          </p>
        ) : (
          <PayPalScriptProvider
            options={{
              clientId: import.meta.env.VITE_PAYPAL_CLIENT_ID,
              currency: "USD"
            }}
          >
            <PayPalButtons
              createOrder={async () => {
                const order = await createPayPalOrder(milestoneId);
                return order.paypalOrderId;
              }}
              onApprove={async (data) => {
                try {
                  setMessage("Capturing payment...");
                  await capturePayPalOrder(data.orderID);
                  const refreshed = await getMilestone(milestoneId);
                  setMilestone(refreshed);
                  setMessage("Payment confirmed.");
                } catch (error) {
                  setMessage(error.message || "Payment capture failed.");
                }
              }}
              onCancel={() => setMessage("Approval cancelled. Try again.")}
              onError={(error) =>
                setMessage(error.message || "PayPal error.")
              }
            />
          </PayPalScriptProvider>
        )}

        {message && <p>{message}</p>}

        <p style={{ marginTop: 16 }}>
          <Link className="pay-link" to="/">
            Back to dashboard
          </Link>
        </p>
      </section>
    </Layout>
  );
}
