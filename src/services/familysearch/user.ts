import { familySearchFetch } from "./client";

export interface FamilySearchUser {
  id: string;
  contactName: string;
  helperAccessPin?: string;
  familyName?: string;
  givenName?: string;
  displayName?: string;
  email?: string;
  personId?: string;
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
    personId?: string;
    treeUserId?: string;
    links?: {
      person?: { href?: string };
    };
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

    // In FamilySearch, user.personId or links.person.href points to the Person in the Family Tree (e.g. GYT8-36P).
    // user.treeUserId (e.g. 9QZ9-PY5) is an internal account identifier that returns 410 Gone on person/ancestry endpoints.
    const realTreePersonId =
      user.personId ||
      user.links?.person?.href?.match(/persons\/([A-Za-z0-9_-]+)/)?.[1] ||
      user.treeUserId;

    return {
      id: user.id,
      contactName: user.contactName || user.displayName || "FamilySearch User",
      displayName: user.displayName,
      givenName: user.givenName,
      familyName: user.familyName,
      email: user.email,
      personId: realTreePersonId,
      treeUserId: realTreePersonId,
    };
  } catch (_error) {
    // If token is expired or unauthorized, return null gracefully so UI reflects unauthenticated state
    return null;
  }
}
