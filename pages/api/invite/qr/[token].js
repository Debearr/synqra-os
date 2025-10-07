import qrcode from "qrcode";

function getBaseUrl(req) {
  if (process.env.APP_URL) return process.env.APP_URL;
  const proto = (req.headers["x-forwarded-proto"] || "http").toString();
  const host = req.headers.host;
  return `${proto}://${host}`;
}

export default async function handler(req, res) {
  const { token } = req.query;
  const url = `${getBaseUrl(req)}/invite/${token}`;
  const png = await qrcode.toBuffer(url, { margin: 1, width: 360 });
  res.setHeader("Content-Type", "image/png");
  res.send(png);
}
