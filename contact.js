// אתחול EmailJS
(function() {
  emailjs.init({
    publicKey: "ZlMWywxR4b4mdTC4K"
  });
})();

// שליחת טופס צור קשר
function sendContactEmail(event) {
  event.preventDefault();
  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const message = document.getElementById("message").value.trim();

  if (!name || !email || !message) {
    alert("אנא מלא את כל השדות");
    return;
  }

  const params = {
    name: name,
    email: email,
    message: message
  };

  emailjs.send("service_kjsnnck", "template_wr7hgzi", params)
    .then(() => {
      alert("ההודעה נשלחה בהצלחה!");
      // איפוס שדות
      document.getElementById("name").value = "";
      document.getElementById("email").value = "";
      document.getElementById("message").value = "";
    })
    .catch((err) => {
      console.error("שגיאה בשליחה:", err);
      alert("אירעה שגיאה בשליחת ההודעה.");
    });
}
