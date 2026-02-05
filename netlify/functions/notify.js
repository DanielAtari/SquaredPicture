const SEEN_CACHE = new Map();
const CACHE_TTL_MS = 10 * 60 * 1000;
const EMAILJS_ENDPOINT = "https://api.emailjs.com/api/v1.0/email/send";
const EMAILJS_SERVICE_ID = "service_kjsnnck";
const EMAILJS_TEMPLATE_ID = "template_xtvgubk";
const EMAILJS_PUBLIC_KEY = "ZlMWywxR4b4mdTC4K";

function getRequestBody(event) {
  if (!event.body) return { raw: "", data: {} };
  const raw = event.isBase64Encoded
    ? Buffer.from(event.body, "base64").toString("utf8")
    : event.body;
  try {
    return { raw, data: JSON.parse(raw) };
  } catch {
    const params = new URLSearchParams(raw);
    return { raw, data: Object.fromEntries(params.entries()) };
  }
}

function extractIds(payload) {
  const orderId =
    payload.order_id ||
    payload.DCdisable ||
    payload.z_field ||
    payload.Z_field ||
    null;
  const tranzilaTransactionId =
    payload.tran_id ||
    payload.transaction_id ||
    payload.TranzilaTransactionId ||
    payload.TransId ||
    null;
  return { orderId, tranzilaTransactionId };
}

function isSuccess(payload) {
  const response = payload.Response || payload.response || payload.RESPONSE;
  const success = payload.Success || payload.success || payload.SUCCESS;
  if (response) return String(response) === "000";
  if (success) return String(success) === "1" || String(success).toLowerCase() === "true";
  return false;
}

async function sendEmail(payload) {
  const templateParams = {
    full_name: payload.contact || payload.full_name || "",
    phone: payload.phone || "",
    email: payload.email || "",
    address: payload.address || "",
    notes: payload.remarks || payload.notes || "",
    price: payload.price || payload.sum || "",
    order_time: payload.order_time || new Date().toLocaleString(),
    order_id: payload.order_id || payload.DCdisable || "",
    image1: payload.image1 || "",
    image2: payload.image2 || "",
    image3: payload.image3 || "",
    image4: payload.image4 || "",
    image5: payload.image5 || "",
    image6: payload.image6 || "",
    image7: payload.image7 || "",
    image8: payload.image8 || "",
    image9: payload.image9 || "",
  };

  const response = await fetch(EMAILJS_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      service_id: EMAILJS_SERVICE_ID,
      template_id: EMAILJS_TEMPLATE_ID,
      user_id: EMAILJS_PUBLIC_KEY,
      template_params: templateParams,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    console.warn("EmailJS send failed", text);
  }
}

function cleanupCache(now) {
  for (const [key, value] of SEEN_CACHE.entries()) {
    if (now - value > CACHE_TTL_MS) {
      SEEN_CACHE.delete(key);
    }
  }
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const { raw, data } = getRequestBody(event);
  const { orderId, tranzilaTransactionId } = extractIds(data);
  const timestamp = new Date().toISOString();
  const success = isSuccess(data);

  cleanupCache(Date.now());

  const dedupeKey = `${orderId || "unknown"}:${tranzilaTransactionId || "unknown"}`;
  const seen = SEEN_CACHE.has(dedupeKey);
  SEEN_CACHE.set(dedupeKey, Date.now());

  const logPayload = {
    order_id: orderId,
    tranzila_transaction_id: tranzilaTransactionId,
    timestamp,
    success,
    duplicate: seen,
    raw,
  };

  console.log("Tranzila notify", JSON.stringify(logPayload));

  if (success && !seen) {
    await sendEmail(data);
  }

  return {
    statusCode: 200,
    headers: { "Content-Type": "text/plain" },
    body: "OK",
  };
};
