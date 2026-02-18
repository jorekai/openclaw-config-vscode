export function cancelPendingValidation(
  pendingValidations: Map<string, NodeJS.Timeout>,
  key: string,
): void {
  const existing = pendingValidations.get(key);
  if (!existing) {
    return;
  }
  clearTimeout(existing);
  pendingValidations.delete(key);
}

export function clearAllPendingValidations(
  pendingValidations: Map<string, NodeJS.Timeout>,
): void {
  for (const timeout of pendingValidations.values()) {
    clearTimeout(timeout);
  }
  pendingValidations.clear();
}
