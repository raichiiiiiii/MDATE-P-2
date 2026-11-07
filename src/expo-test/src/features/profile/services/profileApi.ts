import type { ApiRequest } from "../../auth/apiClient";
import type { MdateAccount } from "../../auth/accountApi";

export type MyProfile = { account: MdateAccount; avatarUrl: string | null; avatarUpdatedAt: string | null };
export type AvatarUploadTicket = { uploadId: string; uploadUrl: string; expiresAt: string; headers: Record<string, string> };
export type SessionSummary = { id: string; createdAt: string; lastActiveAt: string; expiresAt: string };

export async function getMyProfile(apiRequest: ApiRequest): Promise<MyProfile> {
  return apiRequest<MyProfile>("/api/v1/me/profile");
}
export async function updateMyProfile(apiRequest: ApiRequest, displayName: string): Promise<{ account: MdateAccount }> {
  return apiRequest("/api/v1/me/profile", { method: "PATCH", body: { displayName } });
}
export async function createAvatarUpload(apiRequest: ApiRequest, contentType: string, sizeBytes: number): Promise<AvatarUploadTicket> {
  return apiRequest("/api/v1/me/profile/avatar/upload-url", { method: "POST", body: { contentType, sizeBytes } });
}
export async function confirmAvatarUpload(apiRequest: ApiRequest, uploadId: string): Promise<MyProfile> {
  return apiRequest("/api/v1/me/profile/avatar/confirm", { method: "POST", body: { uploadId } });
}
export async function deleteMyAvatar(apiRequest: ApiRequest): Promise<MyProfile> {
  return apiRequest("/api/v1/me/profile/avatar", { method: "DELETE" });
}
export async function requestEmailChange(apiRequest: ApiRequest, currentPassword: string, newEmail: string): Promise<{ message: string }> {
  return apiRequest("/api/v1/me/email-change/request", { method: "POST", body: { currentPassword, newEmail } });
}
export async function changeMyPassword(apiRequest: ApiRequest, currentPassword: string, newPassword: string): Promise<{ message: string }> {
  return apiRequest("/api/v1/me/password/change", { method: "POST", body: { currentPassword, newPassword } });
}
export async function getMySessions(apiRequest: ApiRequest): Promise<{ sessions: SessionSummary[]; currentSessionId: string }> {
  return apiRequest("/api/v1/me/sessions");
}
export async function revokeMySession(apiRequest: ApiRequest, sessionId: string): Promise<void> {
  return apiRequest(`/api/v1/me/sessions/${encodeURIComponent(sessionId)}`, { method: "DELETE" });
}
export async function revokeOtherSessions(apiRequest: ApiRequest): Promise<{ message: string }> {
  return apiRequest("/api/v1/me/sessions/revoke-others", { method: "POST", body: {} });
}
