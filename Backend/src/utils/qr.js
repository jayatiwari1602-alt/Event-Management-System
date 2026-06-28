const QRCode = require("qrcode");
const { nanoid } = require("nanoid");

/**
 * Returns a short payload string that gets embedded in the QR.
 * Kept short on purpose — QR density/scannability degrades with long payloads.
 * The actual lookup happens server-side via this token, not by parsing JSON out of the QR.
 */
function generateQrPayload({ eventId, userId }) {
  return `EP:${eventId}:${userId}:${nanoid(8)}`;
}

/** Returns a base64 PNG data URI the frontend can drop straight into an <img src="..."> */
async function generateQrImage(payload) {
  return QRCode.toDataURL(payload, { width: 300, margin: 1 });
}

module.exports = { generateQrPayload, generateQrImage };
