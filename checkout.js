// 🟢 אתחול EmailJS
emailjs.init({
  publicKey: "ZlMWywxR4b4mdTC4K"
});

// 🔄 פונקציה להעלאה ל-Cloudinary
async function uploadToCloudinary(base64) {
  const formData = new FormData();
  formData.append("file", base64);
  formData.append("upload_preset", "default"); // ← שים כאן את ה־preset שלך

  const response = await fetch("https://api.cloudinary.com/v1_1/dq7ulltem/image/upload", {
    method: "POST",
    body: formData
  });

  const data = await response.json();
  return data.secure_url;
}

// 🟢 הפונקציה שנקראת מהכפתור ב־HTML
window.handlePayment = async function () {
  const fullName = document.getElementById("full-name").value.trim();
  const address = document.getElementById("address").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const email = document.getElementById("email").value.trim();
  const notes = document.getElementById("notes").value.trim();
  const checkbox = document.getElementById("terms-checkbox");

  if (!fullName || !address || !phone || !email) {
    alert("אנא מלא את כל שדות החובה: שם, כתובת, טלפון ואימייל.");
    return;
  }

  if (!checkbox.checked) {
    alert("אנא אשר את תנאי השימוש לפני התשלום.");
    return;
  }

  // 🖼 טעינת תמונות מקישורים של Cloudinary (ולא base64)
  const uploadedBase64s = JSON.parse(sessionStorage.getItem("uploadedImages")) || [];

  if (uploadedBase64s.length !== 9) {
    alert("נדרשות בדיוק 9 תמונות להזמנה.");
    return;
  }

  try {
    document.body.style.cursor = "wait";

    const uploadedUrls = await Promise.all(uploadedBase64s.map(uploadToCloudinary));

    // 📨 בניית אובייקט הנתונים למשלוח
    const params = {
      full_name: fullName,
      phone: phone,
      email: email,
      address: address,
      notes: notes,
      price: 129,
      order_time: new Date().toLocaleString(),
      order_id: "ORD-" + Date.now(),
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

    console.log("🧾 פרטי ההזמנה:", params);

    await emailjs.send("service_kjsnnck", "template_xtvgubk", params);

    alert("ההזמנה נשלחה בהצלחה!");
    window.location.href = "thankyou.html";

  } catch (err) {
    alert("שגיאה בשליחת ההזמנה: " + err.message);
    console.error("❌ שגיאה:", err);
  } finally {
    document.body.style.cursor = "default";
  }
};
