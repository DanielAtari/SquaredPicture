// Netlify serverless function – handle Tranzila success callback
// Replaces the Express route: /tranzila/success

exports.handler = async (event) => {
  // Tranzila may POST or GET – handle both
  let payload = {};
  if (event.httpMethod === "POST" && event.body) {
    const contentType = (event.headers["content-type"] || "").toLowerCase();
    if (contentType.includes("application/json")) {
      try { payload = JSON.parse(event.body); } catch (_) { /* ignore */ }
    } else {
      payload = Object.fromEntries(new URLSearchParams(event.body));
    }
  }
  // Merge query string params (Tranzila sometimes sends data there)
  if (event.queryStringParameters) {
    payload = { ...payload, ...event.queryStringParameters };
  }

  console.log("Tranzila success payload:", JSON.stringify(payload));

  const params = new URLSearchParams({
    ConfirmationCode: payload.ConfirmationCode || "",
    sum: payload.sum || "",
    contact: payload.contact || "",
    email: payload.email || "",
    index: payload.index || ""
  });

  return {
    statusCode: 302,
    headers: { Location: "/thankyou.html?" + params.toString() }
  };
};
