// 🚧 דגל פיתוח - שנה ל-false לפני העלאה לפרודקשן!
const DEV_MODE = false;

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

async function goToPayment() {
  try {
    const images = JSON.parse(sessionStorage.getItem("uploadedImages")) || [];

    // 🚧 במצב פיתוח - דילוג על בדיקת 9 תמונות
    if (!DEV_MODE && images.length !== 9) {
      alert("יש להעלות בדיוק 9 תמונות להזמנה.");
      return;
    }
    
    if (images.length === 0) {
      alert("לא נמצאו תמונות. חזור לעמוד ההזמנה.");
      return;
    }

    document.body.style.cursor = "wait";

    const uploadedUrls = await Promise.all(images.map(uploadToCloudinary));

    // נשמור את הקישורים ב-sessionStorage כדי שנשתמש בהם בעמוד התשלום
    sessionStorage.setItem("uploadedImageUrls", JSON.stringify(uploadedUrls));

    window.location.href = "checkout.html"; // מעבר לעמוד התשלום

  } catch (err) {
    alert("שגיאה בהעלאת התמונות: " + err.message);
  } finally {
    document.body.style.cursor = "default";
  }
}

function goBack() {
  window.location.href = "order.html";
}
