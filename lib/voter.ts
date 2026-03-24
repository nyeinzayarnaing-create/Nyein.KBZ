const VOTER_ID_KEY = "kq_voter_id";
const KING_VOTED_KEY = "kq_king_voted";
const QUEEN_VOTED_KEY = "kq_queen_voted";

export function getVoterId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(VOTER_ID_KEY);
}

export function setVoterId(id: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(VOTER_ID_KEY, id);
}

export function clearVoterId(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(VOTER_ID_KEY);
  localStorage.removeItem(KING_VOTED_KEY);
  localStorage.removeItem(QUEEN_VOTED_KEY);
}

export function getKingVoted(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(KING_VOTED_KEY);
}

export function getQueenVoted(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(QUEEN_VOTED_KEY);
}

export function setKingVoted(candidateId: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(KING_VOTED_KEY, candidateId);
}

export function setQueenVoted(candidateId: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(QUEEN_VOTED_KEY, candidateId);
}

export function hasVotedInCategory(gender: "king" | "queen"): boolean {
  if (gender === "king") return getKingVoted() !== null;
  return getQueenVoted() !== null;
}

export function getVotedCandidateId(gender: "king" | "queen"): string | null {
  if (gender === "king") return getKingVoted();
  return getQueenVoted();
}

export function clearVotedState(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KING_VOTED_KEY);
  localStorage.removeItem(QUEEN_VOTED_KEY);
}
