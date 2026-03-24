export interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'EMPLOYEE';
  avatar?: string;
  createdAt?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResponse extends AuthTokens {
  user: User;
}

export interface RSVP {
  id: string;
  userId: string;
  attending: boolean;
  createdAt: string;
  updatedAt: string;
  user?: Pick<User, 'id' | 'name' | 'email'>;
}

export interface RSVPCounts {
  attending: number;
  notAttending: number;
  total: number;
  pending: number;
}

export interface Poll {
  id: string;
  question: string;
  isActive: boolean;
  createdAt: string;
  userVote: string | null;
  options: PollOption[];
}

export interface PollOption {
  id: string;
  text: string;
  voteCount: number;
  percentage?: number;
  voters?: Pick<User, 'id' | 'name'>[];
}

export interface PollResults {
  id: string;
  question: string;
  totalVotes: number;
  options: PollOption[];
}

export interface Photo {
  id: string;
  url: string;
  thumbnailUrl?: string;
  caption?: string;
  likes: number;
  likedBy?: string[];
  uploadedAt: string;
  uploaderId: string;
  uploader: Pick<User, 'id' | 'name' | 'avatar'>;
}

export interface Feedback {
  id: string;
  userId?: string;
  isAnonymous: boolean;
  rating: number;
  message: string;
  category: FeedbackCategory;
  submittedAt: string;
  user?: Pick<User, 'id' | 'name' | 'avatar' | 'email'>;
  displayName: string;
}

export type FeedbackCategory = 'GENERAL' | 'VENUE' | 'FOOD' | 'ACTIVITIES' | 'TEAM' | 'SUGGESTIONS';

export interface Message {
  id: string;
  senderId: string;
  content: string;
  isGlobal: boolean;
  createdAt: string;
  sender: Pick<User, 'id' | 'name' | 'avatar' | 'role'>;
}

export interface EventConfig {
  id: string;
  outingDate: string;
  venueName?: string;
  venueAddress?: string;
  description?: string;
  bannerUrl?: string;
}

export interface AdminStats {
  totalInvited: number;
  attending: number;
  notAttending: number;
  pending: number;
  attendingPercent: number;
  notAttendingPercent: number;
  photoCount: number;
  feedbackCount: number;
  messageCount: number;
}

export interface ActivityLog {
  id: string;
  userId?: string;
  action: string;
  details?: string;
  createdAt: string;
  user?: Pick<User, 'id' | 'name' | 'avatar'>;
}

export interface Leaderboard {
  mostUploads: { user: Pick<User, 'id' | 'name' | 'avatar'>; count: number }[];
  mostLiked: Photo[];
}
