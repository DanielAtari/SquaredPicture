const TRANZILA_ENDPOINT = "https://directng.tranzila.com/fxproey2909/iframenew.php";
// Tranzila currency: usually "1" for ILS (adjust if your account differs).
const TRANZILA_CURRENCY = "1";
const TRANZILA_TRANMODE = "A";
const TRANZILA_LANG = "il";
const TRANZILA_COUNTRY = "Israel";

const TEST_MODE = true;
const TEST_AMOUNT = 1;
const ORDER_PRICE = 129;
const IFRAME_LOAD_TIMEOUT_MS = 12000;

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

function getAbsoluteUrl(path) {
  return new URL(path, window.location.href).toString();
}

function showLoader(show) {
  document.body.style.cursor = show ? "wait" : "default";
  document.getElementById("loader").style.display = show ? "block" : "none";
}

function showPaymentStatus(message) {
  const statusEl = document.getElementById("payment-status");
  if (statusEl) {
    statusEl.textContent = message;
  }
}

function showPaymentError(message) {
  const errorEl = document.getElementById("payment-error");
  if (errorEl) {
    errorEl.textContent = message;
    errorEl.hidden = false;
  }
}

function clearPaymentError() {
  const errorEl = document.getElementById("payment-error");
  if (errorEl) {
    errorEl.textContent = "";
    errorEl.hidden = true;
  }
}

function showPaymentSection(orderId, amount) {
  const section = document.getElementById("payment-section");
  const orderIdEl = document.getElementById("order-id-display");
  const amountEl = document.getElementById("payment-amount-display");

  if (orderIdEl) {
    orderIdEl.textContent = orderId;
  }

  if (amountEl) {
    amountEl.textContent = `₪${amount}`;
  }

  if (section) {
    section.classList.add("is-visible");
    section.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function getChargeAmount() {
  return TEST_MODE ? TEST_AMOUNT : ORDER_PRICE;
}

function updatePriceDisplay(amount) {
  const priceEl = document.querySelector(".price");
  const amountEl = document.getElementById("payment-amount-display");
  if (priceEl) {
    priceEl.textContent = `₪${amount}`;
  }
  if (amountEl) {
    amountEl.textContent = `₪${amount}`;
  }

  const badge = document.getElementById("test-mode-badge");
  if (badge) {
    badge.hidden = !TEST_MODE;
  }
}

function validateTranzilaParams(params) {
  const missing = [];
  if (!params.price) missing.push("sum");
  if (!TRANZILA_CURRENCY) missing.push("currency");
  if (!params.full_name) missing.push("contact");
  if (!params.company) missing.push("company");
  if (!params.email) missing.push("email");
  if (!params.country) missing.push("country");
  if (!params.address) missing.push("address");
  if (!params.city) missing.push("city");
  if (!params.zip) missing.push("zip");
  if (!TRANZILA_TRANMODE) missing.push("tranmode");
  if (!TRANZILA_ENDPOINT) missing.push("endpoint");

  if (missing.length > 0) {
    showPaymentError(`חסרים פרמטרים לתשלום: ${missing.join(", ")}`);
    return false;
  }

  return true;
}

function fillTranzilaForm(params) {
  const setValue = (id, value) => {
    const input = document.getElementById(id);
    if (input) {
      input.value = value ?? "";
    }
  };

  setValue("tranzila-sum", params.price);
  setValue("tranzila-currency", TRANZILA_CURRENCY);
  setValue("tranzila-contact", params.full_name);
  setValue("tranzila-company", params.company);
  setValue("tranzila-email", params.email);
  setValue("tranzila-country", params.country);
  setValue("tranzila-address", params.address);
  setValue("tranzila-city", params.city || "");
  setValue("tranzila-zip", params.zip || "");
  setValue("tranzila-tranmode", TRANZILA_TRANMODE);
  setValue("tranzila-lang", TRANZILA_LANG);
  setValue("tranzila-success-url", getAbsoluteUrl("thankyou.html"));
  setValue("tranzila-fail-url", getAbsoluteUrl("payment-fail.html"));

  const form = document.getElementById("tranzila-form");
  if (form) {
    form.action = TRANZILA_ENDPOINT;
  }
}

function storePendingOrder(params) {
  sessionStorage.setItem("order_price", params.price);
  sessionStorage.setItem("last_order_id", params.order_id);
  sessionStorage.setItem("pending_order_email", JSON.stringify(params));
}

async function ensureUploadedImageUrls() {
  const existingUrls = JSON.parse(sessionStorage.getItem("uploadedImageUrls")) || [];
  if (existingUrls.length === 9) {
    return existingUrls;
  }

  const uploadedBase64s = JSON.parse(sessionStorage.getItem("uploadedImages")) || [];

  if (uploadedBase64s.length !== 9) {
    alert("נדרשות בדיוק 9 תמונות להזמנה.");
    return null;
  }

  const uploadedUrls = await Promise.all(uploadedBase64s.map(uploadToCloudinary));
  sessionStorage.setItem("uploadedImageUrls", JSON.stringify(uploadedUrls));
  return uploadedUrls;
}

// 📨 הכנת פרטי הזמנה (ללא שליחת מייל עד לתשלום מוצלח)
async function prepareOrderData() {
  showLoader(true);

  try {
    const fullName = document.getElementById("full-name")?.value.trim() || "";
    const address = document.getElementById("address")?.value.trim() || "";
    const city = document.getElementById("city")?.value.trim() || "";
    const zip = document.getElementById("zip")?.value.trim() || "";
    const phone = document.getElementById("phone")?.value.trim() || "";
    const email = document.getElementById("email")?.value.trim() || "";
    const notes = document.getElementById("notes")?.value.trim() || "";

    const uploadedUrls = await ensureUploadedImageUrls();
    if (!uploadedUrls) {
      return null;
    }

    const orderId = "ORD-" + Date.now();

    const params = {
      full_name: fullName,
      company: fullName,
      phone: phone,
      email: email,
      country: TRANZILA_COUNTRY,
      address: address,
      city: city,
      zip: zip,
      notes: notes,
      price: getChargeAmount(),
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

    storePendingOrder(params);
    return params;
  } catch (err) {
    alert("❌ שגיאה בהזמנה: " + err.message);
    console.error("שגיאה:", err);
    return null;
  } finally {
    showLoader(false);
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
    const city = document.getElementById("city").value.trim();
    const zip = document.getElementById("zip").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const email = document.getElementById("email").value.trim();
    const checkbox = document.getElementById("terms-checkbox");

    if (!fullName || !address || !city || !zip || !phone || !email) {
      alert("אנא מלא את כל שדות החובה.");
      return;
    }

    if (!checkbox.checked) {
      alert("יש לאשר את תנאי השימוש.");
      return;
    }

    // השבת כפתור בזמן עיבוד
    this.disabled = true;
    this.textContent = "מכין תשלום...";

    clearPaymentError();
    showPaymentStatus("טוען סליקה…");
    const params = await prepareOrderData();

    if (params) {
      if (!validateTranzilaParams(params)) {
        this.disabled = false;
        this.textContent = "שלח הזמנה";
        return;
      }

      showPaymentSection(params.order_id, params.price);
      fillTranzilaForm(params);

      const form = document.getElementById("tranzila-form");
      if (form) {
        const iframe = document.getElementById("tranzila-iframe");
        let hasLoaded = false;

        if (iframe) {
          iframe.addEventListener("load", () => {
            hasLoaded = true;
            showPaymentStatus("מסך תשלום נטען");
          }, { once: true });
        }

        setTimeout(() => {
          if (!hasLoaded) {
            showPaymentError("ה־iframe לא נטען. בדוק שאין חסימה בדפדפן או פרמטר חסר.");
            showPaymentStatus("טוען סליקה…");
          }
        }, IFRAME_LOAD_TIMEOUT_MS);

        form.submit();
      }
    } else {
      // אפשר שוב ללחוץ אם נכשל
      this.disabled = false;
      this.textContent = "שלח הזמנה";
    }
  });
}

updatePriceDisplay(getChargeAmount());
