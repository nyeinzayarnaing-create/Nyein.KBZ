export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      candidates: {
        Row: {
          id: string;
          name: string;
          photo_url: string | null;
          gender: "king" | "queen";
          group_name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          photo_url?: string | null;
          gender: "king" | "queen";
          group_name?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          photo_url?: string | null;
          gender?: "king" | "queen";
          group_name?: string;
          created_at?: string;
        };
      };
      votes: {
        Row: {
          id: string;
          voter_id: string;
          candidate_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          voter_id: string;
          candidate_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          voter_id?: string;
          candidate_id?: string;
          created_at?: string;
        };
      };
      performance_groups: {
        Row: {
          id: string;
          name: string;
          photo_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          photo_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          photo_url?: string | null;
          created_at?: string;
        };
      };
      performance_votes: {
        Row: {
          id: string;
          voter_id: string;
          group_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          voter_id: string;
          group_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          voter_id?: string;
          group_id?: string;
          created_at?: string;
        };
      };
      settings: {
        Row: {
          id: string;
          timer_seconds: number;
          timer_end_at: string | null;
          voting_active: boolean;
          winners_revealed: boolean;
          performance_voting_active: boolean;
          performance_winners_revealed: boolean;
          updated_at: string;
        };
        Insert: {
          id?: string;
          timer_seconds?: number;
          timer_end_at?: string | null;
          voting_active?: boolean;
          winners_revealed?: boolean;
          performance_voting_active?: boolean;
          performance_winners_revealed?: boolean;
          updated_at?: string;
        };
        Update: {
          timer_seconds?: number;
          timer_end_at?: string | null;
          voting_active?: boolean;
          winners_revealed?: boolean;
          performance_voting_active?: boolean;
          performance_winners_revealed?: boolean;
          updated_at?: string;
        };
      };
    };
  };
}
