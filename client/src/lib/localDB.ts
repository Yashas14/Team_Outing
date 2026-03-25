/**
 * SupabaseDB — replaces the localStorage layer.
 * All data is now persisted in Supabase and syncs across every browser/device.
 * Same function names as before — now every function returns a Promise.
 */
import bcrypt from 'bcryptjs';
import { supabase } from './supabase';
import type {
  User, RSVP, RSVPCounts, Poll, Photo,
  Message, Feedback, EventConfig, AdminStats, ActivityLog, Leaderboard,
} from '../types';

// ── Seed / Initialize ─────────────────────────────────────────────────────────
export async function initDB(): Promise<void> {
  try {
    const { data } = await supabase.from('users').select('id').eq('role', 'ADMIN').limit(1);
    if (data && data.length > 0) return; // already seeded

    const hash = bcrypt.hashSync('failsafe@123', 10);
    await supabase.from('users').upsert([
      { id: 'usr-admin-1', email: 'ashutosh.choudhary@siemens.com', name: 'Ashutosh Choudhary', role: 'ADMIN', password_hash: hash },
      { id: 'usr-admin-2', email: 'd.yashas@siemens.com',           name: 'Yashas D',           role: 'ADMIN', password_hash: hash },
      { id: 'usr-admin-3', email: 'nagarjuna.kn@siemens.com',       name: 'Nagarjuna KN',       role: 'ADMIN', password_hash: hash },
    ]);
    await supabase.from('event_config').upsert({
      id: 'default-config',
      outing_date: '2026-04-01T09:00:00.000Z',
      venue_name: 'Sunset Beach Resort',
      venue_address: '123 Ocean Drive, Crystal Bay, CA 90210',
      description: 'Join us for an amazing day of fun, food, and team bonding! Beach games, BBQ lunch, team challenges, and sunset dinner await. This is going to be the best team outing yet!',
    });
    const pollSeeds = [
      { id: 'poll-1', question: 'What activity are you most excited about?', options: [{ id: 'opt-1a', text: '🏖️ Beach Volleyball' }, { id: 'opt-1b', text: '🎨 Team Art Workshop' }, { id: 'opt-1c', text: '🎮 Gaming Tournament' }, { id: 'opt-1d', text: '🧘 Yoga & Wellness' }, { id: 'opt-1e', text: '🍳 Cooking Challenge' }] },
      { id: 'poll-2', question: 'What cuisine should we have for lunch?', options: [{ id: 'opt-2a', text: '🍔 BBQ & Grill' }, { id: 'opt-2b', text: '🍕 Italian' }, { id: 'opt-2c', text: '🍣 Japanese' }, { id: 'opt-2d', text: '🌮 Mexican' }, { id: 'opt-2e', text: '🥗 Healthy/Vegan' }] },
    ];
    for (const p of pollSeeds) {
      await supabase.from('polls').upsert({ id: p.id, question: p.question, is_active: true });
      await supabase.from('poll_options').upsert(p.options.map((o) => ({ id: o.id, poll_id: p.id, text: o.text, vote_count: 0 })));
    }
  } catch (e) { console.error('initDB error:', e); }
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export async function authenticateUser(email: string, password: string): Promise<{ user: User; requiresPasswordSetup: boolean } | null> {
  const { data } = await supabase.from('users').select('*').eq('email', email.toLowerCase()).limit(1);
  const found = data?.[0];
  if (!found) return null;
  if (!found.password_hash) return { user: mapUser(found), requiresPasswordSetup: true };
  if (!password) return null;
  if (!bcrypt.compareSync(password, found.password_hash)) return null;
  return { user: mapUser(found), requiresPasswordSetup: false };
}

export async function setupPassword(email: string, password: string): Promise<User | null> {
  const { data } = await supabase.from('users').select('*').eq('email', email.toLowerCase()).limit(1);
  const found = data?.[0];
  if (!found) return null;
  if (found.password_hash) throw new Error('Password already set. Please log in normally.');
  const hash = bcrypt.hashSync(password, 10);
  const { data: updated } = await supabase.from('users').update({ password_hash: hash }).eq('id', found.id).select().single();
  return updated ? mapUser(updated) : null;
}

export async function getUserById(id: string): Promise<User | null> {
  const { data } = await supabase.from('users').select('*').eq('id', id).single();
  return data ? mapUser(data) : null;
}

export async function inviteUser(email: string, name: string): Promise<User> {
  const { data: existing } = await supabase.from('users').select('id').eq('email', email.toLowerCase()).limit(1);
  if (existing && existing.length > 0) throw new Error('User already exists');
  const id = crypto.randomUUID();
  const { data, error } = await supabase.from('users').insert({ id, email: email.toLowerCase(), name, role: 'EMPLOYEE' }).select().single();
  if (error) throw new Error(error.message);
  await addActivityLog(undefined, 'USER_INVITED', `${name} (${email}) was invited`);
  return mapUser(data);
}

function mapUser(row: any): User {
  return { id: row.id, email: row.email, name: row.name, role: row.role, avatar: row.avatar || undefined, createdAt: row.created_at };
}

// ── RSVP ──────────────────────────────────────────────────────────────────────
export async function getMyRsvp(userId: string): Promise<RSVP | null> {
  const { data } = await supabase.from('rsvps').select('*, users(id, name, email)').eq('user_id', userId).maybeSingle();
  return data ? mapRsvp(data) : null;
}

export async function submitRsvp(userId: string, attending: boolean): Promise<RSVP> {
  const user = await getUserById(userId);
  const { data: existing } = await supabase.from('rsvps').select('id').eq('user_id', userId).maybeSingle();
  if (existing) {
    const { data } = await supabase.from('rsvps').update({ attending, updated_at: new Date().toISOString() }).eq('user_id', userId).select('*, users(id, name, email)').single();
    await addActivityLog(userId, 'RSVP_UPDATED', `${user?.name} changed RSVP to ${attending ? 'Yes' : 'No'}`);
    return mapRsvp(data);
  }
  const { data } = await supabase.from('rsvps').insert({ id: crypto.randomUUID(), user_id: userId, attending }).select('*, users(id, name, email)').single();
  await addActivityLog(userId, 'RSVP_SUBMITTED', `${user?.name} RSVP'd ${attending ? 'Yes' : 'No'}`);
  return mapRsvp(data);
}

export async function getRsvpCounts(): Promise<RSVPCounts> {
  const [{ data: rsvps }, { data: employees }] = await Promise.all([supabase.from('rsvps').select('attending'), supabase.from('users').select('id').eq('role', 'EMPLOYEE')]);
  const total = employees?.length || 0;
  const attending = rsvps?.filter((r) => r.attending).length || 0;
  const notAttending = rsvps?.filter((r) => !r.attending).length || 0;
  return { attending, notAttending, total, pending: total - attending - notAttending };
}

export async function getAllRsvps(): Promise<RSVP[]> {
  const { data } = await supabase.from('rsvps').select('*, users(id, name, email)').order('created_at', { ascending: false });
  return (data || []).map(mapRsvp);
}

function mapRsvp(row: any): RSVP {
  return { id: row.id, userId: row.user_id, attending: row.attending, createdAt: row.created_at, updatedAt: row.updated_at, user: row.users ? { id: row.users.id, name: row.users.name, email: row.users.email } : undefined };
}

// ── Polls ─────────────────────────────────────────────────────────────────────
export async function getPolls(userId: string): Promise<Poll[]> {
  const [{ data: polls }, { data: votes }] = await Promise.all([
    supabase.from('polls').select('*, poll_options(*)').eq('is_active', true).order('created_at'),
    supabase.from('poll_votes').select('poll_id, option_id').eq('user_id', userId),
  ]);
  const userVoteMap: Record<string, string> = {};
  votes?.forEach((v) => { userVoteMap[v.poll_id] = v.option_id; });
  return (polls || []).map((p) => {
    const totalVotes = p.poll_options.reduce((s: number, o: any) => s + o.vote_count, 0);
    return {
      id: p.id, question: p.question, isActive: p.is_active, createdAt: p.created_at,
      userVote: userVoteMap[p.id] || null,
      options: (p.poll_options as any[]).map((o) => ({ id: o.id, text: o.text, voteCount: o.vote_count, percentage: totalVotes > 0 ? Math.round((o.vote_count / totalVotes) * 100) : 0 })),
    };
  });
}

export async function votePoll(pollId: string, optionId: string, userId: string): Promise<void> {
  const { data: prev } = await supabase.from('poll_votes').select('option_id').eq('poll_id', pollId).eq('user_id', userId).maybeSingle();
  if (prev?.option_id === optionId) return;
  if (prev?.option_id) {
    await supabase.rpc('decrement_vote', { option_id_param: prev.option_id });
    await supabase.from('poll_votes').delete().eq('poll_id', pollId).eq('user_id', userId);
  }
  await supabase.rpc('increment_vote', { option_id_param: optionId });
  await supabase.from('poll_votes').upsert({ id: crypto.randomUUID(), poll_id: pollId, option_id: optionId, user_id: userId });
}

export async function createPoll(question: string, options: string[]): Promise<Poll> {
  const pollId = crypto.randomUUID();
  const { data: poll } = await supabase.from('polls').insert({ id: pollId, question, is_active: true }).select().single();
  const opts = options.map((text) => ({ id: crypto.randomUUID(), poll_id: pollId, text, vote_count: 0 }));
  await supabase.from('poll_options').insert(opts);
  await addActivityLog(undefined, 'POLL_CREATED', `New poll: "${question}"`);
  return { id: poll.id, question: poll.question, isActive: poll.is_active, createdAt: poll.created_at, userVote: null, options: opts.map((o) => ({ id: o.id, text: o.text, voteCount: 0, percentage: 0 })) };
}

export async function deletePoll(pollId: string): Promise<void> {
  await supabase.from('polls').delete().eq('id', pollId);
}

// ── Photos ────────────────────────────────────────────────────────────────────
export async function getPhotos(limit = 1000): Promise<{ photos: Photo[] }> {
  const { data: rows, error: photosError } = await supabase.from('photos').select('*').order('uploaded_at', { ascending: false }).limit(limit);
  if (photosError) throw new Error(`getPhotos failed: ${photosError.message}`);
  if (!rows || rows.length === 0) return { photos: [] };

  // Fetch uploader info separately (avoids FK dependency)
  const uploaderIds = [...new Set(rows.map((r) => r.uploader_id).filter(Boolean))];
  const { data: users } = uploaderIds.length
    ? await supabase.from('users').select('id, name, avatar').in('id', uploaderIds)
    : { data: [] };
  const userMap: Record<string, { id: string; name: string; avatar?: string }> = {};
  users?.forEach((u) => { userMap[u.id] = { id: u.id, name: u.name, avatar: u.avatar }; });

  const photoIds = rows.map((r) => r.id);
  const { data: likes } = await supabase.from('photo_likes').select('photo_id, user_id').in('photo_id', photoIds);
  const likeMap: Record<string, string[]> = {};
  likes?.forEach((l) => { if (!likeMap[l.photo_id]) likeMap[l.photo_id] = []; likeMap[l.photo_id].push(l.user_id); });

  return { photos: rows.map((r) => ({ id: r.id, url: r.url, thumbnailUrl: r.thumbnail_url || r.url, caption: r.caption || undefined, likes: r.likes, likedBy: likeMap[r.id] || [], uploadedAt: r.uploaded_at, uploaderId: r.uploader_id, uploader: userMap[r.uploader_id] || { id: r.uploader_id, name: 'Unknown' } })) };
}

export async function uploadPhotos(files: File[], caption: string, userId: string): Promise<void> {
  const user = await getUserById(userId);
  for (const file of files) {
    const ext = file.name.split('.').pop() || 'jpg';
    const path = `${userId}/${crypto.randomUUID()}.${ext}`;

    // Upload original to Supabase Storage
    const { data: stored, error: uploadError } = await supabase.storage
      .from('photos')
      .upload(path, file, { upsert: false });
    if (uploadError) throw new Error(`Storage upload failed: ${uploadError.message}`);

    const { data: { publicUrl } } = supabase.storage.from('photos').getPublicUrl(stored.path);

    // Upload thumbnail
    let thumbUrl = publicUrl;
    try {
      const thumbBlob = await createThumbnailBlob(file, 400);
      const thumbPath = `${userId}/thumb_${crypto.randomUUID()}.jpg`;
      const { data: storedThumb } = await supabase.storage
        .from('photos')
        .upload(thumbPath, thumbBlob, { upsert: false, contentType: 'image/jpeg' });
      if (storedThumb) {
        thumbUrl = supabase.storage.from('photos').getPublicUrl(storedThumb.path).data.publicUrl;
      }
    } catch { /* thumbnail failure is non-fatal, use original */ }

    // Save record to photos table
    const { error: insertError } = await supabase.from('photos').insert({
      id: crypto.randomUUID(),
      url: publicUrl,
      thumbnail_url: thumbUrl,
      caption: caption || null,
      likes: 0,
      uploader_id: userId,
    });
    if (insertError) throw new Error(`Photo save failed: ${insertError.message}`);
  }
  await addActivityLog(userId, 'PHOTO_UPLOADED', `${user?.name || 'User'} uploaded ${files.length} photo(s)`);
}

export async function togglePhotoLike(photoId: string, userId: string): Promise<void> {
  const { data: existing } = await supabase.from('photo_likes').select('photo_id').eq('photo_id', photoId).eq('user_id', userId).maybeSingle();
  const { data: photo } = await supabase.from('photos').select('likes').eq('id', photoId).single();
  if (existing) {
    await supabase.from('photo_likes').delete().eq('photo_id', photoId).eq('user_id', userId);
    await supabase.from('photos').update({ likes: Math.max(0, (photo?.likes || 1) - 1) }).eq('id', photoId);
  } else {
    await supabase.from('photo_likes').insert({ photo_id: photoId, user_id: userId });
    await supabase.from('photos').update({ likes: (photo?.likes || 0) + 1 }).eq('id', photoId);
  }
}

export async function deletePhoto(photoId: string): Promise<void> {
  await supabase.from('photos').delete().eq('id', photoId);
}

export async function getLeaderboard(): Promise<Leaderboard> {
  const [{ data: photoRows }, { data: topLiked }] = await Promise.all([
    supabase.from('photos').select('uploader_id'),
    supabase.from('photos').select('*').order('likes', { ascending: false }).limit(5),
  ]);

  // Collect unique uploader IDs to fetch names
  const allUploaderIds = [...new Set([...(photoRows || []).map((p) => p.uploader_id), ...(topLiked || []).map((p) => p.uploader_id)].filter(Boolean))];
  const { data: users } = allUploaderIds.length
    ? await supabase.from('users').select('id, name, avatar').in('id', allUploaderIds)
    : { data: [] };
  const userMap: Record<string, { id: string; name: string; avatar?: string }> = {};
  users?.forEach((u) => { userMap[u.id] = { id: u.id, name: u.name, avatar: u.avatar }; });

  const uploadCounts = new Map<string, number>();
  photoRows?.forEach((p) => { uploadCounts.set(p.uploader_id, (uploadCounts.get(p.uploader_id) || 0) + 1); });
  const mostUploads = Array.from(uploadCounts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([uid, count]) => ({ user: userMap[uid] || { id: uid, name: 'Unknown' }, count }));
  const mostLiked = (topLiked || []).map((r) => ({ id: r.id, url: r.url, thumbnailUrl: r.thumbnail_url || r.url, caption: r.caption, likes: r.likes, likedBy: [], uploadedAt: r.uploaded_at, uploaderId: r.uploader_id, uploader: userMap[r.uploader_id] || { id: r.uploader_id, name: 'Unknown' } }));
  return { mostUploads, mostLiked };
}

// ── Messages ──────────────────────────────────────────────────────────────────
export async function getMessages(): Promise<{ messages: Message[] }> {
  const { data } = await supabase.from('messages').select('*, users(id, name, avatar, role)').eq('is_global', true).order('created_at', { ascending: true }).limit(200);
  return { messages: (data || []).map((r) => ({ id: r.id, senderId: r.sender_id, content: r.content, isGlobal: r.is_global, createdAt: r.created_at, sender: { id: r.users?.id || r.sender_id, name: r.users?.name || 'Unknown', avatar: r.users?.avatar, role: r.users?.role || 'EMPLOYEE' } })) };
}

export async function sendMessage(content: string, userId: string, isGlobal = true): Promise<Message> {
  const { data, error } = await supabase.from('messages').insert({ id: crypto.randomUUID(), sender_id: userId, content, is_global: isGlobal }).select('*, users(id, name, avatar, role)').single();
  if (error) throw new Error(error.message);
  return { id: data.id, senderId: data.sender_id, content: data.content, isGlobal: data.is_global, createdAt: data.created_at, sender: { id: data.users?.id || userId, name: data.users?.name || 'Unknown', avatar: data.users?.avatar, role: data.users?.role || 'EMPLOYEE' } };
}

export function subscribeToMessages(callback: (msg: Message) => void) {
  return supabase.channel('messages-channel').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, async (payload) => {
    const row = payload.new as any;
    const { data: user } = await supabase.from('users').select('id, name, avatar, role').eq('id', row.sender_id).single();
    callback({ id: row.id, senderId: row.sender_id, content: row.content, isGlobal: row.is_global, createdAt: row.created_at, sender: { id: user?.id || row.sender_id, name: user?.name || 'Unknown', avatar: user?.avatar, role: user?.role || 'EMPLOYEE' } });
  }).subscribe();
}

// ── Feedback ──────────────────────────────────────────────────────────────────
export async function submitFeedback(data: { rating: number; message: string; category: string; isAnonymous: boolean }, userId: string): Promise<Feedback> {
  const user = data.isAnonymous ? null : await getUserById(userId);
  const id = crypto.randomUUID();
  await supabase.from('feedbacks').insert({ id, user_id: data.isAnonymous ? null : userId, is_anonymous: data.isAnonymous, rating: data.rating, message: data.message, category: data.category });
  await addActivityLog(data.isAnonymous ? undefined : userId, 'FEEDBACK_SUBMITTED', `${data.isAnonymous ? 'Anonymous' : user?.name || 'User'} submitted feedback`);
  return { id, userId: data.isAnonymous ? undefined : userId, isAnonymous: data.isAnonymous, rating: data.rating, message: data.message, category: data.category as any, submittedAt: new Date().toISOString(), user: user ? { id: user.id, name: user.name, avatar: user.avatar, email: user.email } : undefined, displayName: data.isAnonymous ? 'Anonymous' : user?.name || 'Unknown' };
}

export async function getFeedbacks(): Promise<Feedback[]> {
  const { data: rows, error } = await supabase.from('feedbacks').select('*').order('submitted_at', { ascending: false });
  if (error) throw new Error(`getFeedbacks failed: ${error.message}`);
  if (!rows || rows.length === 0) return [];

  // Fetch user info separately (feedbacks.user_id has no FK in schema)
  const userIds = [...new Set(rows.map((r) => r.user_id).filter(Boolean))];
  const { data: users } = userIds.length
    ? await supabase.from('users').select('id, name, avatar, email').in('id', userIds)
    : { data: [] };
  const userMap: Record<string, any> = {};
  users?.forEach((u) => { userMap[u.id] = u; });

  return rows.map((r) => {
    const u = r.user_id ? userMap[r.user_id] : undefined;
    return { id: r.id, userId: r.user_id || undefined, isAnonymous: r.is_anonymous, rating: r.rating, message: r.message, category: r.category, submittedAt: r.submitted_at, user: u ? { id: u.id, name: u.name, avatar: u.avatar, email: u.email } : undefined, displayName: r.is_anonymous ? 'Anonymous' : u?.name || 'Unknown' };
  });
}

// ── Event Config ──────────────────────────────────────────────────────────────
export async function getEventConfig(): Promise<EventConfig> {
  const { data } = await supabase.from('event_config').select('*').eq('id', 'default-config').single();
  return data ? { id: data.id, outingDate: data.outing_date, venueName: data.venue_name || undefined, venueAddress: data.venue_address || undefined, description: data.description || undefined, bannerUrl: data.banner_url || undefined } : { id: 'default-config', outingDate: '2026-04-01T09:00:00.000Z', venueName: 'Sunset Beach Resort', venueAddress: '123 Ocean Drive, Crystal Bay, CA 90210', description: 'Join us for an amazing team outing!' };
}

export async function updateEventConfig(update: Partial<EventConfig>): Promise<EventConfig> {
  const payload: any = {};
  if (update.outingDate !== undefined)   payload.outing_date   = update.outingDate;
  if (update.venueName !== undefined)    payload.venue_name    = update.venueName;
  if (update.venueAddress !== undefined) payload.venue_address = update.venueAddress;
  if (update.description !== undefined)  payload.description   = update.description;
  if (update.bannerUrl !== undefined)    payload.banner_url    = update.bannerUrl;
  await supabase.from('event_config').update(payload).eq('id', 'default-config');
  return getEventConfig();
}

// ── Admin Stats ───────────────────────────────────────────────────────────────
export async function getAdminStats(): Promise<AdminStats> {
  const [{ data: employees }, { data: rsvps }, { count: photoCount }, { count: feedbackCount }, { count: messageCount }] = await Promise.all([supabase.from('users').select('id').eq('role', 'EMPLOYEE'), supabase.from('rsvps').select('attending'), supabase.from('photos').select('*', { count: 'exact', head: true }), supabase.from('feedbacks').select('*', { count: 'exact', head: true }), supabase.from('messages').select('*', { count: 'exact', head: true })]);
  const total = employees?.length || 0;
  const attending = rsvps?.filter((r) => r.attending).length || 0;
  const notAttending = rsvps?.filter((r) => !r.attending).length || 0;
  return { totalInvited: total, attending, notAttending, pending: total - attending - notAttending, attendingPercent: total > 0 ? Math.round((attending / total) * 100) : 0, notAttendingPercent: total > 0 ? Math.round((notAttending / total) * 100) : 0, photoCount: photoCount || 0, feedbackCount: feedbackCount || 0, messageCount: messageCount || 0 };
}

// ── Activity Log ──────────────────────────────────────────────────────────────
export async function getActivityLog(): Promise<ActivityLog[]> {
  const { data: rows, error } = await supabase.from('activity_log').select('*').order('created_at', { ascending: false }).limit(100);
  if (error) throw new Error(`getActivityLog failed: ${error.message}`);
  if (!rows || rows.length === 0) return [];

  // Fetch user info separately (avoids FK dependency)
  const userIds = [...new Set(rows.map((r) => r.user_id).filter(Boolean))];
  const { data: users } = userIds.length
    ? await supabase.from('users').select('id, name, avatar').in('id', userIds)
    : { data: [] };
  const userMap: Record<string, { id: string; name: string; avatar?: string }> = {};
  users?.forEach((u) => { userMap[u.id] = { id: u.id, name: u.name, avatar: u.avatar }; });

  return rows.map((r) => ({ id: r.id, userId: r.user_id || undefined, action: r.action, details: r.details || undefined, createdAt: r.created_at, user: r.user_id ? userMap[r.user_id] : undefined }));
}

async function addActivityLog(userId: string | undefined, action: string, details: string): Promise<void> {
  await supabase.from('activity_log').insert({ id: crypto.randomUUID(), user_id: userId || null, action, details });
}

// ── Thumbnail helper ──────────────────────────────────────────────────────────
function createThumbnailBlob(file: File, maxSize: number): Promise<Blob> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > height) { if (width > maxSize) { height = Math.round((height * maxSize) / width); width = maxSize; } } else { if (height > maxSize) { width = Math.round((width * maxSize) / height); height = maxSize; } }
      const canvas = document.createElement('canvas');
      canvas.width = width; canvas.height = height;
      canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);
      canvas.toBlob((blob) => resolve(blob || file), 'image/jpeg', 0.75);
      URL.revokeObjectURL(url);
    };
    img.onerror = () => resolve(file);
    img.src = url;
  });
}

export function resetDB(): void { console.warn('resetDB() is a no-op — data lives in Supabase.'); }
