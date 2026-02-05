const HANDSHAKE_URL = "https://api.tranzila.com/v1/handshake/create";

function getRequestBody(event) {
  if (!event.body) return {};
  const raw = event.isBase64Encoded
    ? Buffer.from(event.body, "base64").toString("utf8")
    : event.body;
  try {
    return JSON.parse(raw);
  } catch {
    const params = new URLSearchParams(raw);
    return Object.fromEntries(params.entries());
  }
}

function resolveTerminal() {
  const env = (process.env.TRANZILA_ENV || "test").toLowerCase();
  const terminal =
    env === "prod"
      ? process.env.TRANZILA_TERMINAL_PROD
      : process.env.TRANZILA_TERMINAL_TEST;
  const iframeTerminal =
    env === "prod"
      ? process.env.TRANZILA_TERMINAL_IFRAME_PROD
      : process.env.TRANZILA_TERMINAL_IFRAME;
  return { env, terminal, iframeTerminal };
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const { env, terminal, iframeTerminal } = resolveTerminal();
  const { sum, order_id: orderId } = getRequestBody(event);
  const tranzilaPw = process.env.TRANZILA_PW;

  if (!terminal || !tranzilaPw) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Missing Tranzila env vars" }),
    };
  }

  if (!sum || !orderId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Missing sum or order_id" }),
    };
  }

  const url = new URL(HANDSHAKE_URL);
  url.searchParams.set("supplier", terminal);
  url.searchParams.set("sum", String(sum));
  url.searchParams.set("TranzilaPW", tranzilaPw);

  try {
    const response = await fetch(url.toString(), { method: "GET" });
    const contentType = response.headers.get("content-type") || "";
    const raw = await response.text();

    if (!response.ok) {
      return {
        statusCode: 502,
        body: JSON.stringify({ error: "Handshake failed", details: raw }),
      };
    }

    let thtk = null;
    if (contentType.includes("application/json")) {
      const data = JSON.parse(raw);
      thtk = data.thtk || data.THTK || data.token || null;
    } else {
      const params = new URLSearchParams(raw);
      thtk = params.get("thtk");
    }

    if (!thtk) {
      return {
        statusCode: 502,
        body: JSON.stringify({ error: "Missing thtk", details: raw }),
      };
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        thtk,
        terminal,
        terminal_iframe: iframeTerminal || terminal,
        env,
        order_id: orderId,
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Handshake error", details: error.message }),
    };
  }
};
