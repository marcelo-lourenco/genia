import { familySearchFetch } from "./client";

export interface FamilySearchUser {
  id: string;
  contactName: string;
  helperAccessPin?: string;
  familyName?: string;
  givenName?: string;
  displayName?: string;
  email?: string;
  treeUserId?: string;
}

interface CurrentUserResponse {
  users?: Array<{
    id: string;
    contactName?: string;
    familyName?: string;
    givenName?: string;
    displayName?: string;
    email?: string;
    treeUserId?: string;
  }>;
}

/**
 * Fetches the currently authenticated FamilySearch user profile
 */
export async function getCurrentUser(): Promise<FamilySearchUser | null> {
  try {
    const data = await familySearchFetch<CurrentUserResponse>("/platform/users/current");
    const user = data?.users?.[0];
    if (!user) {
      return null;
    }

    return {
      id: user.id,
      contactName: user.contactName || user.displayName || "FamilySearch User",
      displayName: user.displayName,
      givenName: user.givenName,
      familyName: user.familyName,
      email: user.email,
      treeUserId: user.treeUserId,
    };
  } catch (_error) {
    // If token is expired or unauthorized, return null gracefully so UI reflects unauthenticated state
    return null;
  }
}
