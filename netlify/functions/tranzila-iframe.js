// Netlify serverless function – proxy POST to Tranzila iframe
// Replaces the Express route: POST /tranzila/iframe

const TRANZILA_ENDPOINT = process.env.TRANZILA_ENDPOINT || "https://directng.tranzila.com/fxproey2909/iframenew.php";

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  let body;
  try {
    // Support both JSON and URL-encoded form data
    const contentType = (event.headers["content-type"] || "").toLowerCase();
    if (contentType.includes("application/json")) {
      body = JSON.parse(event.body);
    } else {
      body = Object.fromEntries(new URLSearchParams(event.body));
    }
  } catch (e) {
    return { statusCode: 400, body: "Invalid request body" };
  }

  const requiredFields = ["sum", "currency", "contact", "email", "country", "zip", "address", "city", "tranmode"];
  const missing = requiredFields.filter((f) => !body[f]);
  if (missing.length > 0) {
    return {
      statusCode: 400,
      headers: { "Content-Type": "text/html; charset=utf-8" },
      body: `<p style="font-family:Arial;color:red;direction:rtl;">חסרים פרמטרים: ${escapeHtml(missing.join(", "))}</p>`
    };
  }

  const fields = Object.entries(body)
    .map(([key, value]) => `<input type="hidden" name="${escapeHtml(key)}" value="${escapeHtml(value)}">`)
    .join("\n");

  const html = `<!DOCTYPE html>
<html lang="he" dir="rtl">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>מעביר לתשלום</title>
  </head>
  <body>
    <p style="font-family: Arial, sans-serif;">מעביר לתשלום מאובטח...</p>
    <form id="tranzila-server-form" method="POST" action="${escapeHtml(TRANZILA_ENDPOINT)}">
      ${fields}
    </form>
    <script>document.getElementById("tranzila-server-form").submit();</script>
  </body>
</html>`;

  return {
    statusCode: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
    body: html
  };
};
