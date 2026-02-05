const EMAIL_PUBLIC_KEY = "ZlMWywxR4b4mdTC4K";
const EMAIL_SERVICE_ID = "service_kjsnnck";
const EMAIL_TEMPLATE_ID = "template_xtvgubk";

function getPendingOrder() {
  const raw = sessionStorage.getItem("pending_order_email");
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch (error) {
    console.error("שגיאה בקריאת נתוני ההזמנה:", error);
    return null;
  }
}

function markOrderEmailSent(orderId) {
  sessionStorage.setItem(`order_email_sent_${orderId}`, "true");
  sessionStorage.removeItem("pending_order_email");
}

async function sendOrderEmail() {
  const pendingOrder = getPendingOrder();
  if (!pendingOrder) {
    return;
  }

  if (sessionStorage.getItem(`order_email_sent_${pendingOrder.order_id}`)) {
    return;
  }

  emailjs.init({
    publicKey: EMAIL_PUBLIC_KEY
  });

  try {
    await emailjs.send(EMAIL_SERVICE_ID, EMAIL_TEMPLATE_ID, pendingOrder);
    console.log("📬 מייל נשלח בהצלחה");
    markOrderEmailSent(pendingOrder.order_id);
  } catch (error) {
    console.error("שגיאה בשליחת המייל:", error);
  }
}

sendOrderEmail();
