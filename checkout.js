// 🟢 אתחול EmailJS
emailjs.init({
  publicKey: "ZlMWywxR4b4mdTC4K"
});

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
// 📨 שליחת פרטי הזמנה במייל
async function prepareOrder() {
  document.body.style.cursor = "wait";

  try {
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

    const orderId = "ORD-" + Date.now();
    sessionStorage.setItem("last_order_id", orderId);

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

    await emailjs.send("service_kjsnnck", "template_xtvgubk", params);
    console.log("📬 מייל נשלח בהצלחה");

    return true;

  } catch (err) {
    alert("❌ שגיאה בהזמנה: " + err.message);
    console.error("שגיאה:", err);
    return false;
  } finally {
    document.body.style.cursor = "default";
  }
}


// 🔘 טעינת כפתור פייפאל מראש
if (typeof paypal !== 'undefined') {
  paypal.Buttons({
    createOrder: function (data, actions) {
      const orderPrice = sessionStorage.getItem("order_price") || '129.00';
      return actions.order.create({
        purchase_units: [{
          amount: {
            value: orderPrice.toString()
          }
        }]
      });
    },
    onApprove: function (data, actions) {
      return actions.order.capture().then(function (details) {
        window.location.href = "thankyou.html";
      });
    }
  }).render('#paypal-button-container');
}

// ▶️ לחיצה על "המשך לתשלום"
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

    const isReady = await prepareOrder();
    if (isReady) {
      document.getElementById("paypal-wrapper").style.display = "block";
      this.style.display = "none";
    }
  });
}
