// 🟢 אתחול EmailJS
emailjs.init({
  publicKey: "ZlMWywxR4b4mdTC4K"
});

// 🚧 דגל פיתוח - שנה ל-false לפני עלייה לפרודקשן
const DEV_MODE = false;

const TRANZILA_CONFIG = {
  currency: 1,
  lang: "il",
  buttonLabel: "שלם",
  enableBit: false,
  enableGooglePay: false
};

const paymentMessage = document.getElementById("payment-message");
const paymentContainer = document.getElementById("payment-container");
const tranzilaForm = document.getElementById("tranzila-form");

const tranzilaInputs = {
  sum: document.getElementById("tranzila-sum"),
  currency: document.getElementById("tranzila-currency"),
  successUrl: document.getElementById("tranzila-success-url"),
  failUrl: document.getElementById("tranzila-fail-url"),
  notifyUrl: document.getElementById("tranzila-notify-url"),
  lang: document.getElementById("tranzila-lang"),
  buttonLabel: document.getElementById("tranzila-button-label"),
  thtk: document.getElementById("tranzila-thtk"),
  dcdisable: document.getElementById("tranzila-dcdisable"),
  u71: document.getElementById("tranzila-u71"),
  newprocess: document.getElementById("tranzila-newprocess"),
  newProcess: document.getElementById("tranzila-new-process"),
  company: document.getElementById("tranzila-company"),
  contact: document.getElementById("tranzila-contact"),
  email: document.getElementById("tranzila-email"),
  address: document.getElementById("tranzila-address"),
  phone: document.getElementById("tranzila-phone"),
  city: document.getElementById("tranzila-city"),
  pdesc: document.getElementById("tranzila-pdesc"),
  remarks: document.getElementById("tranzila-remarks"),
  orderId: document.getElementById("tranzila-order-id"),
  orderTime: document.getElementById("tranzila-order-time"),
  price: document.getElementById("tranzila-price"),
  image1: document.getElementById("tranzila-image1"),
  image2: document.getElementById("tranzila-image2"),
  image3: document.getElementById("tranzila-image3"),
  image4: document.getElementById("tranzila-image4"),
  image5: document.getElementById("tranzila-image5"),
  image6: document.getElementById("tranzila-image6"),
  image7: document.getElementById("tranzila-image7"),
  image8: document.getElementById("tranzila-image8"),
  image9: document.getElementById("tranzila-image9")
};

function showPaymentMessage(text) {
  if (!paymentMessage) return;
  paymentMessage.textContent = text;
  paymentMessage.classList.add("is-visible");
}

function clearPaymentMessage() {
  if (!paymentMessage) return;
  paymentMessage.textContent = "";
  paymentMessage.classList.remove("is-visible");
}

function getOrCreateOrderId() {
  const existing = sessionStorage.getItem("order_id");
  if (existing) return existing;
  const orderId = "ORD-" + Date.now();
  sessionStorage.setItem("order_id", orderId);
  sessionStorage.setItem("last_order_id", orderId);
  return orderId;
}

function buildAbsoluteUrl(path) {
  return new URL(path, window.location.origin).toString();
}

function applyTranzilaParams(params) {
  if (!tranzilaForm) return;
  tranzilaForm.action = params.action;
  tranzilaInputs.sum.value = params.sum;
  tranzilaInputs.currency.value = params.currency;
  tranzilaInputs.successUrl.value = params.successUrl;
  tranzilaInputs.failUrl.value = params.failUrl;
  tranzilaInputs.notifyUrl.value = params.notifyUrl;
  tranzilaInputs.lang.value = params.lang;
  tranzilaInputs.buttonLabel.value = params.buttonLabel;
  tranzilaInputs.thtk.value = params.thtk;
  tranzilaInputs.dcdisable.value = params.dcdisable;
  tranzilaInputs.u71.value = "1";
  tranzilaInputs.newprocess.value = "1";
  tranzilaInputs.newProcess.value = "1";
}

function applyOrderParams(params) {
  tranzilaInputs.company.value = params.company || "";
  tranzilaInputs.contact.value = params.contact || "";
  tranzilaInputs.email.value = params.email || "";
  tranzilaInputs.address.value = params.address || "";
  tranzilaInputs.phone.value = params.phone || "";
  tranzilaInputs.city.value = params.city || "";
  tranzilaInputs.pdesc.value = params.pdesc || "";
  tranzilaInputs.remarks.value = params.remarks || "";
  tranzilaInputs.orderId.value = params.orderId || "";
  tranzilaInputs.orderTime.value = params.orderTime || "";
  tranzilaInputs.price.value = params.price || "";
  tranzilaInputs.image1.value = params.image1 || "";
  tranzilaInputs.image2.value = params.image2 || "";
  tranzilaInputs.image3.value = params.image3 || "";
  tranzilaInputs.image4.value = params.image4 || "";
  tranzilaInputs.image5.value = params.image5 || "";
  tranzilaInputs.image6.value = params.image6 || "";
  tranzilaInputs.image7.value = params.image7 || "";
  tranzilaInputs.image8.value = params.image8 || "";
  tranzilaInputs.image9.value = params.image9 || "";
}

async function requestHandshake(sum, orderId) {
  const response = await fetch("/.netlify/functions/handshake", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sum, order_id: orderId })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "Handshake failed");
  }

  return response.json();
}

function showFailMessageIfNeeded() {
  const params = new URLSearchParams(window.location.search);
  if (params.get("payment") === "failed") {
    showPaymentMessage("שגיאת תשלום. נסה שוב או השתמש באמצעי תשלום אחר.");
  }
}

async function startPaymentFlow(sum, orderId) {
  clearPaymentMessage();
  if (paymentContainer) paymentContainer.hidden = true;

  let handshake;
  try {
    handshake = await requestHandshake(sum, orderId);
  } catch (error) {
    showPaymentMessage("שגיאת מערכת בעת התחברות לסליקה. נסה שוב בעוד רגע.");
    throw error;
  }

  sessionStorage.setItem("tranzila_thtk", handshake.thtk);

  const successUrl = buildAbsoluteUrl("thankyou.html");
  const failUrl = buildAbsoluteUrl("checkout.html?payment=failed");
  const notifyUrl = buildAbsoluteUrl(".netlify/functions/notify");

  applyTranzilaParams({
    action: `https://direct.tranzila.com/${handshake.terminal_iframe || handshake.terminal}/iframenew.php`,
    sum,
    currency: TRANZILA_CONFIG.currency,
    successUrl,
    failUrl,
    notifyUrl,
    lang: TRANZILA_CONFIG.lang,
    buttonLabel: TRANZILA_CONFIG.buttonLabel,
    thtk: handshake.thtk,
    dcdisable: orderId
  });

  if (paymentContainer) paymentContainer.hidden = false;
  tranzilaForm.submit();
}

showFailMessageIfNeeded();

// 🔁 פונקציית העלאה ל-Cloudinary
async function uploadToCloudinary(base64) {
  const formData = new FormData();
  formData.append("file", base64);
  formData.append("upload_preset", "default");

  const response = await fetch("https://api.cloudinary.com/v1_1/dq7ulltem/image/upload", {
    method: "POST",
    body: formData
  });

  const data = await response.json();
  return data.secure_url;
}

// 📨 שליחת פרטי הזמנה במייל
async function prepareOrder() {
  document.body.style.cursor = "wait";
  document.getElementById("loader").style.display = "block";

  try {
    if (DEV_MODE) {
      const orderId = getOrCreateOrderId();
      sessionStorage.setItem("order_price", 129);
      applyOrderParams({
        company: "תמונה בריבוע",
        contact: "Test User",
        email: "test@example.com",
        address: "Test Address",
        phone: "0501234567",
        pdesc: "DEV order",
        remarks: "DEV_MODE",
        orderId,
        orderTime: new Date().toLocaleString(),
        price: 129,
      });
      console.log("🧪 DEV_MODE enabled - skipping uploads and email", { order_id: orderId });
      return true;
    }

    const fullName = document.getElementById("full-name")?.value.trim() || "";
    const address = document.getElementById("address")?.value.trim() || "";
    const phone = document.getElementById("phone")?.value.trim() || "";
    const email = document.getElementById("email")?.value.trim() || "";
    const notes = document.getElementById("notes")?.value.trim() || "";

    const uploadedBase64s = JSON.parse(sessionStorage.getItem("uploadedImages")) || [];

    if (uploadedBase64s.length !== 9) {
      alert("נדרשות בדיוק 9 תמונות להזמנה.");
      return false;
    }

    const uploadedUrls = await Promise.all(uploadedBase64s.map(uploadToCloudinary));

    const orderId = getOrCreateOrderId();

    const params = {
      full_name: fullName,
      phone: phone,
      email: email,
      address: address,
      notes: notes,
      price: 129,
      order_time: new Date().toLocaleString(),
      order_id: orderId,
      image1: uploadedUrls[0],
      image2: uploadedUrls[1],
      image3: uploadedUrls[2],
      image4: uploadedUrls[3],
      image5: uploadedUrls[4],
      image6: uploadedUrls[5],
      image7: uploadedUrls[6],
      image8: uploadedUrls[7],
      image9: uploadedUrls[8]
    };

    sessionStorage.setItem("order_price", params.price);

    applyOrderParams({
      company: "תמונה בריבוע",
      contact: params.full_name,
      email: params.email,
      address: params.address,
      phone: params.phone,
      pdesc: "הזמנת מגנטים - 9 תמונות",
      remarks: params.notes,
      orderId: params.order_id,
      orderTime: params.order_time,
      price: params.price,
      image1: params.image1,
      image2: params.image2,
      image3: params.image3,
      image4: params.image4,
      image5: params.image5,
      image6: params.image6,
      image7: params.image7,
      image8: params.image8,
      image9: params.image9,
    });

    return true;

  } catch (err) {
    alert("❌ שגיאה בהזמנה: " + err.message);
    console.error("שגיאה:", err);
    return false;
  } finally {
    document.body.style.cursor = "default";
    document.getElementById("loader").style.display = "none";
  }
}

/*
  ============================================================================
  💳 שירות סליקה - הוראות להוספת שירות תשלום בעתיד
  ============================================================================
  
  1. בחר שירות סליקה (PayPlus, Tranzila, CardCom, iCount, Green Invoice וכו')
  
  2. הוסף את הסקריפט של השירות ב-checkout.html (ראה הערה שם)
  
  3. הוסף כאן קוד לאתחול השירות, לדוגמה:
  
     // אתחול שירות תשלום
     const paymentService = new PaymentProvider({
       merchantId: "YOUR_MERCHANT_ID",
       apiKey: "YOUR_API_KEY"
     });
  
  4. עדכן את הפונקציה handlePaymentClick למטה כך שתפתח את טופס התשלום
  
  5. הוסף callback לאחר תשלום מוצלח שיפנה ל-thankyou.html
  
  ============================================================================
*/

// ▶️ לחיצה על "שלח הזמנה"
const continueBtn = document.getElementById("continue-button");
if (continueBtn) {
  continueBtn.addEventListener("click", async function () {
    const fullName = document.getElementById("full-name").value.trim();
    const address = document.getElementById("address").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const email = document.getElementById("email").value.trim();
    const checkbox = document.getElementById("terms-checkbox");

    if (!fullName || !address || !phone || !email) {
      alert("אנא מלא את כל שדות החובה.");
      return;
    }

    if (!checkbox.checked) {
      alert("יש לאשר את תנאי השימוש.");
      return;
    }

    // השבת כפתור בזמן עיבוד
    this.disabled = true;
    this.textContent = "שולח...";

    const isReady = await prepareOrder();
    
    if (isReady) {
      const orderId = getOrCreateOrderId();
      const sum = sessionStorage.getItem("order_price") || 129;
      try {
        await startPaymentFlow(sum, orderId);
        this.textContent = "ממתין לתשלום...";
      } catch (error) {
        this.disabled = false;
        this.textContent = "שלח הזמנה";
      }
    } else {
      // אפשר שוב ללחוץ אם נכשל
      this.disabled = false;
      this.textContent = "שלח הזמנה";
    }
  });
}
