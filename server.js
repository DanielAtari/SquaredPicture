const express = require("express");
const path = require("path");
require("dotenv").config();

const app = express();

const PORT = process.env.PORT || 3000;
const TRANZILA_ENDPOINT =
  process.env.TRANZILA_ENDPOINT ||
  "https://directng.tranzila.com/fxproey2909/iframenew.php";
const TRANZILA_SUPPLIER = process.env.TRANZILA_SUPPLIER || "";
const TRANZILA_PW = process.env.TRANZILA_PW || "";

app.use(express.urlencoded({ extended: true, limit: "1mb" }));

app.use(express.static(path.join(__dirname)));

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderError(message) {
  return `
    <!DOCTYPE html>
    <html lang="he" dir="rtl">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>שגיאה בתשלום</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 24px; background: #fff; color: #333; }
          .error { border: 1px solid #b00020; padding: 16px; border-radius: 8px; color: #b00020; }
        </style>
      </head>
      <body>
        <div class="error">שגיאה: ${escapeHtml(message)}</div>
      </body>
    </html>
  `;
}

async function fetchHandshakeToken(sum) {
  if (!TRANZILA_SUPPLIER || !TRANZILA_PW) {
    throw new Error("חסרים משתני סביבה: TRANZILA_SUPPLIER או TRANZILA_PW");
  }

  const url = new URL("https://api.tranzila.com/v1/handshake/create");
  url.searchParams.set("supplier", TRANZILA_SUPPLIER);
  url.searchParams.set("sum", sum);
  url.searchParams.set("TranzilaPW", TRANZILA_PW);

  const response = await fetch(url.toString(), { method: "GET" });
  if (!response.ok) {
    const rawBody = await response.text();
    console.error("Handshake response body:", rawBody);
    throw new Error(`Handshake נכשל: ${response.status}`);
  }

  const rawBody = await response.text();
  let thtk = "";

  try {
    const data = JSON.parse(rawBody);
    if (data && data.thtk) {
      thtk = data.thtk;
    }
  } catch (error) {
    // Some responses return plain text like: "thtk=..."
    const match = rawBody.match(/thtk=([a-zA-Z0-9]+)/);
    if (match) {
      thtk = match[1];
    } else {
      console.error("Handshake response is not JSON:", rawBody);
    }
  }

  if (!thtk) {
    throw new Error("Handshake נכשל: לא הוחזר thtk");
  }

  return thtk;
}

app.post("/tranzila/iframe", async (req, res) => {
  console.log("Tranzila iframe payload:", req.body);
  const requiredFields = [
    "sum",
    "currency",
    "contact",
    "company",
    "email",
    "country",
    "zip",
    "address",
    "city",
    "tranmode"
  ];

  const missing = requiredFields.filter((field) => !req.body[field]);
  if (missing.length > 0) {
    console.error("Missing Tranzila fields:", missing);
    return res
      .status(400)
      .send(renderError(`חסרים פרמטרים: ${missing.join(", ")}`));
  }

  // HandShake disabled in Tranzila dashboard – skip thtk generation.
  // To re-enable, uncomment the block below and set correct TRANZILA_SUPPLIER / TRANZILA_PW.
  //
  // let thtk = "";
  // try {
  //   console.log("Handshake request sum:", req.body.sum);
  //   thtk = await fetchHandshakeToken(req.body.sum);
  //   console.log("Handshake token acquired");
  // } catch (error) {
  //   console.error("Handshake error:", error);
  //   return res.status(400).send(renderError(error.message));
  // }

  const fields = Object.entries(req.body)
    .map(
      ([key, value]) =>
        `<input type="hidden" name="${escapeHtml(key)}" value="${escapeHtml(
          value
        )}">`
    )
    .join("\n");

  return res.send(`
    <!DOCTYPE html>
    <html lang="he" dir="rtl">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>מעביר לתשלום</title>
      </head>
      <body>
        <p style="font-family: Arial, sans-serif;">מעביר לתשלום מאובטח...</p>
        <form id="tranzila-server-form" method="POST" action="${escapeHtml(
          TRANZILA_ENDPOINT
        )}">
          ${fields}
        </form>
        <script>
          document.getElementById("tranzila-server-form").submit();
        </script>
      </body>
    </html>
  `);
});

function renderResultPage(title, payload) {
  return `
    <!DOCTYPE html>
    <html lang="he" dir="rtl">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>${escapeHtml(title)}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 24px; background: #fff; color: #333; }
          pre { background: #f7f7f7; padding: 12px; border-radius: 8px; overflow: auto; }
        </style>
      </head>
      <body>
        <h2>${escapeHtml(title)}</h2>
        <pre>${escapeHtml(JSON.stringify(payload, null, 2))}</pre>
      </body>
    </html>
  `;
}

app.all("/tranzila/success", (req, res) => {
  const payload = Object.keys(req.body || {}).length ? req.body : req.query;
  console.log("Tranzila success payload:", payload);

  const params = new URLSearchParams({
    ConfirmationCode: payload.ConfirmationCode || "",
    sum: payload.sum || "",
    contact: payload.contact || "",
    email: payload.email || "",
    index: payload.index || ""
  });
  res.redirect("/thankyou.html?" + params.toString());
});

app.all("/tranzila/fail", (req, res) => {
  const payload = Object.keys(req.body || {}).length ? req.body : req.query;
  console.log("Tranzila fail payload:", payload);

  const params = new URLSearchParams({
    Response: payload.Response || "",
    sum: payload.sum || "",
    contact: payload.contact || ""
  });
  res.redirect("/payment-fail.html?" + params.toString());
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
