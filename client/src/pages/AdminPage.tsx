import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  LogOut, Users, CheckCircle2, XCircle, Camera, MessageSquare,
  BarChart3, Settings, Download, Trash2, Plus, Clock,
  Bell, UserPlus, MapPin, FileText
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';
import { useRsvpStore } from '../store/rsvpStore';
import { usePollStore } from '../store/pollStore';
import { useEventStore } from '../store/eventStore';
import CountdownTimer from '../components/countdown/CountdownTimer';
import PollWidget from '../components/poll/PollWidget';
import { PhotoGallery, PhotoUploader } from '../components/photos/PhotoGallery';
import MessageBoard from '../components/messaging/MessageBoard';
import * as db from '../lib/localDB';
import { formatDate, formatTableDate, timeAgo } from '../lib/utils';
import type { AdminStats, Photo, RSVP, ActivityLog } from '../types';

type AdminTab = 'overview' | 'rsvp' | 'polls' | 'photos' | 'messages' | 'settings' | 'activity';

export default function AdminPage() {
  const { user, logout } = useAuthStore();
  const { fetchAllRsvps, allRsvps, fetchCounts, counts } = useRsvpStore();
  const { fetchPolls, polls, createPoll, deletePoll } = usePollStore();
  const { fetchConfig, config, updateConfig } = useEventStore();
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [activityLog, setActivityLog] = useState<ActivityLog[]>([]);
  const [rsvpFilter, setRsvpFilter] = useState<'ALL' | 'YES' | 'NO'>('ALL');
  const [rsvpSort, setRsvpSort] = useState<{ field: 'name' | 'email' | 'vote' | 'date'; dir: 'asc' | 'desc' }>({
    field: 'date', dir: 'desc',
  });

  // Poll creation form
  const [showPollForm, setShowPollForm] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);

  // Invite form
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');

  // Event settings
  const [editVenue, setEditVenue] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editDesc, setEditDesc] = useState('');

  useEffect(() => {
    fetchStats();
    fetchCounts();
    fetchPolls();
    fetchConfig();
    fetchAllRsvps();
  }, []);

  useEffect(() => {
    if (activeTab === 'photos') fetchPhotos();
    if (activeTab === 'activity') fetchActivity();
    if (activeTab === 'settings' && config) {
      setEditVenue(config.venueName || '');
      setEditAddress(config.venueAddress || '');
      setEditDesc(config.description || '');
    }
  }, [activeTab, config]);

  const fetchStats = async () => {
    try {
      const stats = await db.getAdminStats();
      setStats(stats);
    } catch {}
  };

  const fetchPhotos = async () => {
    try {
      const { photos: p } = await db.getPhotos(1000);
      console.log('fetchPhotos got:', p.length, 'photos');
      setPhotos(p);
    } catch (err: any) {
      console.error('fetchPhotos error:', err?.message || err);
    }
  };

  const fetchActivity = async () => {
    try {
      const logs = await db.getActivityLog();
      setActivityLog(logs);
    } catch {}
  };

  // Client-side CSV export — 4 columns only
  const exportCSV = () => {
    try {
      const rows = filteredRsvps.map((r) => [
        `"${r.user?.name ?? ''}"`,
        `"${r.user?.email ?? ''}"`,
        `"${r.attending ? 'Yes' : 'No'}"`,
        `"${formatTableDate(r.createdAt)}"`,
      ].join(','));
      const csv = ['Name,Email ID,Vote,Date & Time Voted', ...rows].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'rsvp-results.csv';
      a.click();
      toast.success('CSV exported!');
    } catch {
      toast.error('Export failed');
    }
  };

  const handleCreatePoll = async () => {
    const validOptions = pollOptions.filter((o) => o.trim());
    if (!pollQuestion.trim() || validOptions.length < 2) {
      toast.error('Need question + at least 2 options');
      return;
    }
    try {
      await createPoll(pollQuestion, validOptions);
      toast.success('Poll created! 🗳️');
      setPollQuestion('');
      setPollOptions(['', '']);
      setShowPollForm(false);
    } catch {
      toast.error('Failed to create poll');
    }
  };

  const handleInvite = async () => {
    try {
      await db.inviteUser(inviteEmail, inviteName);
      toast.success(`Invited ${inviteName}!`);
      setShowInvite(false);
      setInviteEmail('');
      setInviteName('');
      fetchStats();
    } catch (err: any) {
      toast.error(err.message || 'Invite failed');
    }
  };

  const handleSaveSettings = async () => {
    try {
      await updateConfig({
        venueName: editVenue,
        venueAddress: editAddress,
        description: editDesc,
      });
      toast.success('Settings saved!');
    } catch {
      toast.error('Failed to save');
    }
  };

  const filteredRsvps = (() => {
    const list = allRsvps.filter((r) => {
      if (rsvpFilter === 'YES') return r.attending;
      if (rsvpFilter === 'NO') return !r.attending;
      return true;
    });
    return [...list].sort((a, b) => {
      const dir = rsvpSort.dir === 'asc' ? 1 : -1;
      switch (rsvpSort.field) {
        case 'name':  return dir * (a.user?.name ?? '').localeCompare(b.user?.name ?? '');
        case 'email': return dir * (a.user?.email ?? '').localeCompare(b.user?.email ?? '');
        case 'vote':  return dir * (Number(a.attending) - Number(b.attending));
        case 'date':  return dir * (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        default: return 0;
      }
    });
  })();

  const toggleSort = (field: typeof rsvpSort.field) => {
    setRsvpSort((s) => ({
      field,
      dir: s.field === field && s.dir === 'asc' ? 'desc' : 'asc',
    }));
  };

  const SortIcon = ({ field }: { field: typeof rsvpSort.field }) => (
    <span className="ml-1 text-xs">{rsvpSort.field === field ? (rsvpSort.dir === 'asc' ? '▲' : '▼') : '▼▲'.split('').map((c, i) => <span key={i} className="opacity-30">{c}</span>)}</span>
  );

  const TABS: { id: AdminTab; icon: React.ReactNode; label: string }[] = [
    { id: 'overview', icon: <BarChart3 size={18} />, label: 'Overview' },
    { id: 'rsvp', icon: <Users size={18} />, label: 'RSVPs' },
    { id: 'polls', icon: <BarChart3 size={18} />, label: 'Polls' },
    { id: 'photos', icon: <Camera size={18} />, label: 'Photos' },
    { id: 'messages', icon: <MessageSquare size={18} />, label: 'Messages' },
    { id: 'activity', icon: <Clock size={18} />, label: 'Activity' },
    { id: 'settings', icon: <Settings size={18} />, label: 'Settings' },
  ];

  return (
    <div className="min-h-screen bg-muted">
      {/* Header */}
      <header className="bg-dark text-white sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">👑</span>
            <div>
              <h1 className="font-display text-lg font-bold leading-tight">Admin Dashboard</h1>
              <p className="text-xs text-gray-400">Team Outing 2026</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Bell size={20} className="text-gray-400 hover:text-white cursor-pointer transition-colors" />
              {stats && stats.messageCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] flex items-center justify-center font-bold">
                  {stats.feedbackCount}
                </span>
              )}
            </div>
            <div className="hidden sm:block text-right">
              <p className="text-sm font-semibold">{user?.name}</p>
              <p className="text-xs text-gray-400">Admin</p>
            </div>
            <button
              onClick={logout}
              className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <nav className="bg-white border-b border-gray-100 sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1 overflow-x-auto py-2 -mx-4 px-4">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? 'bg-dark text-white shadow-md'
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="page-container">
        {/* OVERVIEW */}
        {activeTab === 'overview' && stats && (
          <div className="space-y-8">
            {/* Countdown */}
            <div className="card text-center py-6">
              <CountdownTimer targetDate={config?.outingDate || '2026-04-01T09:00:00.000Z'} />
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              <StatsCard icon={<Users />} label="Total Invited" value={stats.totalInvited} color="bg-blue-500" />
              <StatsCard
                icon={<CheckCircle2 />}
                label="Attending"
                value={`${stats.attending} (${stats.attendingPercent}%)`}
                color="bg-accent"
              />
              <StatsCard
                icon={<XCircle />}
                label="Not Attending"
                value={`${stats.notAttending} (${stats.notAttendingPercent}%)`}
                color="bg-red-400"
              />
              <StatsCard icon={<Camera />} label="Photos" value={stats.photoCount} color="bg-purple-500" />
              <StatsCard icon={<MessageSquare />} label="Messages" value={stats.messageCount} color="bg-primary" />
            </div>

            {/* Quick RSVP progress bar */}
            <div className="card">
              <h3 className="font-display text-lg font-bold text-dark mb-4">RSVP Progress</h3>
              <div className="h-8 bg-gray-100 rounded-full overflow-hidden flex">
                <div
                  className="bg-accent h-full transition-all duration-500 flex items-center justify-center text-xs font-bold text-white"
                  style={{ width: `${stats.attendingPercent}%` }}
                >
                  {stats.attendingPercent > 10 && `${stats.attendingPercent}%`}
                </div>
                <div
                  className="bg-red-300 h-full transition-all duration-500 flex items-center justify-center text-xs font-bold text-white"
                  style={{ width: `${stats.notAttendingPercent}%` }}
                >
                  {stats.notAttendingPercent > 10 && `${stats.notAttendingPercent}%`}
                </div>
              </div>
              <div className="flex gap-4 mt-3 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-full bg-accent" /> Attending
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-full bg-red-300" /> Not Attending
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-full bg-gray-200" /> Pending
                </span>
              </div>
            </div>
          </div>
        )}

        {/* RSVP LIST */}
        {activeTab === 'rsvp' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <h2 className="section-title">RSVP List</h2>
              <div className="flex items-center gap-2">
                <div className="flex bg-gray-100 rounded-xl p-1">
                  {(['ALL', 'YES', 'NO'] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setRsvpFilter(f)}
                      className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        rsvpFilter === f ? 'bg-white text-dark shadow-sm' : 'text-gray-500'
                      }`}
                    >
                      {f === 'ALL' ? `All (${allRsvps.length})` : f === 'YES' ? '✅ Yes' : '❌ No'}
                    </button>
                  ))}
                </div>
                <button onClick={exportCSV} className="btn-ghost text-sm flex items-center gap-1">
                  <Download size={16} /> Export CSV
                </button>
              </div>
            </div>

            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        className="text-left px-4 py-3 font-semibold text-gray-600 cursor-pointer select-none hover:bg-gray-100"
                        onClick={() => toggleSort('name')}
                      >
                        Name <SortIcon field="name" />
                      </th>
                      <th
                        className="text-left px-4 py-3 font-semibold text-gray-600 cursor-pointer select-none hover:bg-gray-100"
                        onClick={() => toggleSort('email')}
                      >
                        Email ID <SortIcon field="email" />
                      </th>
                      <th
                        className="text-left px-4 py-3 font-semibold text-gray-600 cursor-pointer select-none hover:bg-gray-100"
                        onClick={() => toggleSort('vote')}
                      >
                        Vote <SortIcon field="vote" />
                      </th>
                      <th
                        className="text-left px-4 py-3 font-semibold text-gray-600 cursor-pointer select-none hover:bg-gray-100"
                        onClick={() => toggleSort('date')}
                      >
                        Date &amp; Time Voted <SortIcon field="date" />
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredRsvps.map((rsvp) => (
                      <tr key={rsvp.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-dark">{rsvp.user?.name}</td>
                        <td className="px-4 py-3 text-gray-500">{rsvp.user?.email}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`badge ${
                              rsvp.attending ? 'bg-accent-50 text-accent-700' : 'bg-red-50 text-red-600'
                            }`}
                          >
                            {rsvp.attending ? '✅ Yes' : '❌ No'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-400 text-xs">{formatTableDate(rsvp.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredRsvps.length === 0 && (
                  <p className="text-center py-8 text-gray-400">No RSVPs found</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* POLLS */}
        {activeTab === 'polls' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="section-title">Polls</h2>
              <button
                onClick={() => setShowPollForm(!showPollForm)}
                className="btn-primary text-sm flex items-center gap-2"
              >
                <Plus size={16} />
                Create Poll
              </button>
            </div>

            {showPollForm && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="card"
              >
                <h3 className="font-display text-lg font-bold text-dark mb-4">New Poll</h3>
                <input
                  type="text"
                  placeholder="What's your question?"
                  value={pollQuestion}
                  onChange={(e) => setPollQuestion(e.target.value)}
                  className="input-field mb-4"
                />
                <div className="space-y-2 mb-4">
                  {pollOptions.map((opt, i) => (
                    <div key={i} className="flex gap-2">
                      <input
                        type="text"
                        placeholder={`Option ${i + 1}`}
                        value={opt}
                        onChange={(e) => {
                          const newOpts = [...pollOptions];
                          newOpts[i] = e.target.value;
                          setPollOptions(newOpts);
                        }}
                        className="input-field flex-1"
                      />
                      {pollOptions.length > 2 && (
                        <button
                          onClick={() => setPollOptions(pollOptions.filter((_, idx) => idx !== i))}
                          className="text-gray-400 hover:text-red-400"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                {pollOptions.length < 10 && (
                  <button
                    onClick={() => setPollOptions([...pollOptions, ''])}
                    className="text-sm text-primary hover:underline mb-4 block"
                  >
                    + Add option
                  </button>
                )}
                <div className="flex gap-2">
                  <button onClick={handleCreatePoll} className="btn-primary text-sm">
                    Create Poll
                  </button>
                  <button onClick={() => setShowPollForm(false)} className="btn-ghost text-sm">
                    Cancel
                  </button>
                </div>
              </motion.div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {polls.map((poll) => (
                <div key={poll.id} className="relative">
                  <PollWidget poll={poll} />
                  <button
                    onClick={() => {
                      if (confirm('Delete this poll?')) deletePoll(poll.id);
                    }}
                    className="absolute top-4 right-4 text-gray-300 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PHOTOS */}
        {activeTab === 'photos' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="section-title">Photo Gallery ({photos.length})</h2>
            </div>
            <PhotoUploader onUpload={fetchPhotos} />
            <PhotoGallery photos={photos} onRefresh={fetchPhotos} />
          </div>
        )}

        {/* MESSAGES */}
        {activeTab === 'messages' && <MessageBoard />}

        {/* ACTIVITY LOG */}
        {activeTab === 'activity' && (
          <div className="space-y-4">
            <h2 className="section-title">Activity Log</h2>
            <div className="card">
              {activityLog.length === 0 ? (
                <p className="text-center text-gray-400 py-8">No activity yet</p>
              ) : (
                <div className="space-y-3">
                  {activityLog.map((log) => (
                    <div key={log.id} className="flex items-start gap-3 py-2 border-b border-gray-50 last:border-0">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <Clock size={14} className="text-gray-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-700">{log.details || log.action}</p>
                        <p className="text-xs text-gray-400">{timeAgo(log.createdAt)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* SETTINGS */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <h2 className="section-title">Event Settings</h2>

            <div className="card space-y-4">
              <h3 className="font-display text-lg font-bold text-dark flex items-center gap-2">
                <MapPin size={20} className="text-primary" />
                Event Details
              </h3>
              <div>
                <label className="text-sm font-medium text-gray-600 block mb-1">Venue Name</label>
                <input
                  type="text"
                  value={editVenue}
                  onChange={(e) => setEditVenue(e.target.value)}
                  className="input-field"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 block mb-1">Address</label>
                <input
                  type="text"
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  className="input-field"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 block mb-1">Description</label>
                <textarea
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  rows={3}
                  className="input-field resize-none"
                />
              </div>
              <button onClick={handleSaveSettings} className="btn-primary">
                Save Changes
              </button>
            </div>

            {/* Invite Employee */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display text-lg font-bold text-dark flex items-center gap-2">
                  <UserPlus size={20} className="text-accent" />
                  Invite Employee
                </h3>
                <button
                  onClick={() => setShowInvite(!showInvite)}
                  className="btn-accent text-sm flex items-center gap-1"
                >
                  <Plus size={16} /> Invite
                </button>
              </div>

              {showInvite && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-3"
                >
                  <input
                    type="text"
                    placeholder="Full name"
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    className="input-field"
                  />
                  <input
                    type="email"
                    placeholder="Email address (@siemens.com)"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="input-field"
                  />
                  <button onClick={handleInvite} className="btn-accent w-full">
                    Send Invite
                  </button>
                </motion.div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function StatsCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card flex items-center gap-4"
    >
      <div className={`p-3 rounded-2xl text-white ${color}`}>{icon}</div>
      <div>
        <p className="text-2xl font-bold text-dark">{value}</p>
        <p className="text-xs text-gray-500">{label}</p>
      </div>
    </motion.div>
  );
}
