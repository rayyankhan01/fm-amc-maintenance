export function userError(error, fallback) {
  const status = Number(error?.status ?? error?.statusCode);
  if (error?.code === "23505") return "A record with these details already exists. Please check and try again.";
  if (error?.code === "23503") return "This record is linked to other information and cannot be changed or deleted.";
  if (error?.code === "42501" || status === 403) return "You do not have permission to perform this action. Please contact an administrator.";
  if (status === 401 || error?.code === "PGRST301") return "Your session may have expired. Please sign in again.";
  if (status === 429) return "Too many requests. Please wait a moment and try again.";
  return fallback;
}