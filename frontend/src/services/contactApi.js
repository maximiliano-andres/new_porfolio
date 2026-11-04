/* HTTP adapter for the backend's contact port (POST /api/contact).
   The UI only knows this function; the transport (URL, headers, JSON) lives here. */

/* same limits the server enforces (backend/app/domain/contact.py) */
export const CONTACT_LIMITS = { name: 100, email: 254, message: 5000 };

/** Sends the form and resolves with the raw Response, so the caller maps status codes to messages. */
export function sendContactMessage(form, { signal } = {}) {
  return fetch("/api/contact", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...form, name: form.name.trim(), email: form.email.trim(), message: form.message.trim() }),
    signal,
  });
}
