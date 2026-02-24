export type Candidate = {
  id: string;
  name: string;
  photo_url: string | null;
  gender: "king" | "queen";
  group_name: string;
  created_at: string;
};

export type Vote = {
  id: string;
  voter_id: string;
  candidate_id: string;
  created_at: string;
};

export type Settings = {
  id: string;
  timer_seconds: number;
  timer_end_at: string | null;
  voting_active: boolean;
  winners_revealed: boolean;
  updated_at: string;
};

export type VoteCount = {
  candidate_id: string;
  name: string;
  photo_url: string | null;
  gender: "king" | "queen";
  group_name: string;
  vote_count: number;
};
