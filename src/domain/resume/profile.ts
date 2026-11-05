import type { Profile } from "@/domain/career/contracts";
export function applyResumeSuggestions(profile: Profile, topic: string, interest: string): Profile {
  return {
    ...profile,
    topic,
    interest: interest.trim().slice(0, 600),
  };
}
