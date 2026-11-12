const BINDING_ALLOWED = /[^A-Za-z0-9+\-._.,:#]/g;

/** Auth0 CIBA binding_message: max 64, charset A-Za-z0-9+-_.,:# , no spaces. */
export function sanitizeBindingMessage(raw: string) {
  const cleaned = raw
    .replace(/\s+/g, "-")
    .replace(BINDING_ALLOWED, "")
    .slice(0, 64)
    .replace(/^-+|-+$/g, "");
  return cleaned || "Cancel-grooming";
}

export function bindingMessageForCancel(appointmentId: string) {
  const short = appointmentId.replace(/-/g, "").slice(0, 8);
  return sanitizeBindingMessage(`Cancel-groom-#${short}`);
}
