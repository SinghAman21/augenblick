// ── users ──────────────────────────────────────────────────────────────────
export interface User {
  id: number;
  name: string;
  age: number;
  email: string;
}

export type InsertUser = Omit<User, 'id'>;
export type SelectUser = User;

// ── posts ──────────────────────────────────────────────────────────────────
export interface Post {
  id: number;
  title: string;
  content: string;
  user_id: number;
  created_at: string;
  updated_at: string;
}

export type InsertPost = Omit<Post, 'id' | 'created_at' | 'updated_at'>;
export type SelectPost = Post;

// ── sessions ───────────────────────────────────────────────────────────────
export interface Session {
  id: string;
  title: string;
  description: string | null;
  category: string;
  is_private: boolean;
  owner_id: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export type InsertSession = Omit<Session, 'id' | 'created_at' | 'updated_at' | 'owner_id' | 'status'> & {
  owner_id?: string | null;
  status?: string;
};
export type SelectSession = Session;
