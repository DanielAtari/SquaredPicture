// Netlify serverless function – handle Tranzila fail callback
// Replaces the Express route: /tranzila/fail

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
  if (event.queryStringParameters) {
    payload = { ...payload, ...event.queryStringParameters };
  }

  console.log("Tranzila fail payload:", JSON.stringify(payload));

  const params = new URLSearchParams({
    Response: payload.Response || "",
    sum: payload.sum || "",
    contact: payload.contact || ""
  });

  return {
    statusCode: 302,
    headers: { Location: "/payment-fail.html?" + params.toString() }
  };
};
