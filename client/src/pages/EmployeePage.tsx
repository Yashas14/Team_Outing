import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  LogOut, Calendar, MapPin, Camera, MessageSquare, BarChart3,
  Users, Ticket, Trophy
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useRsvpStore } from '../store/rsvpStore';
import { usePollStore } from '../store/pollStore';
import { useEventStore } from '../store/eventStore';
import CountdownTimer from '../components/countdown/CountdownTimer';
import RSVPCard from '../components/rsvp/RSVPCard';
import PollWidget from '../components/poll/PollWidget';
import { PhotoUploader, PhotoGallery } from '../components/photos/PhotoGallery';
import MessageBoard from '../components/messaging/MessageBoard';
import * as db from '../lib/localDB';
import type { Photo, Leaderboard } from '../types';

type Tab = 'home' | 'photos' | 'messages' | 'polls';

export default function EmployeePage() {
  const { user, logout } = useAuthStore();
  const { fetchMyRsvp, fetchCounts, myRsvp, counts } = useRsvpStore();
  const { fetchPolls, polls } = usePollStore();
  const { fetchConfig, config } = useEventStore();
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [leaderboard, setLeaderboard] = useState<Leaderboard | null>(null);

  useEffect(() => {
    fetchMyRsvp();
    fetchCounts();
    fetchPolls();
    fetchConfig();
  }, []);

  useEffect(() => {
    if (activeTab === 'photos') fetchPhotos();
  }, [activeTab]);

  const fetchPhotos = async () => {
    try {
      const { photos: p } = await db.getPhotos(1000);
      setPhotos(p);
      const lb = await db.getLeaderboard();
      setLeaderboard(lb);
    } catch (err: any) {
      console.error('fetchPhotos error:', err?.message || err);
    }
  };

  const TABS: { id: Tab; icon: React.ReactNode; label: string }[] = [
    { id: 'home', icon: <Calendar size={18} />, label: 'Home' },
    { id: 'photos', icon: <Camera size={18} />, label: 'Photos' },
    { id: 'messages', icon: <MessageSquare size={18} />, label: 'Chat' },
    { id: 'polls', icon: <BarChart3 size={18} />, label: 'Polls' },
  ];

  return (
    <div className="min-h-screen bg-muted">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🏖️</span>
            <div>
              <h1 className="font-display text-lg font-bold text-dark leading-tight">Team Outing</h1>
              <p className="text-xs text-gray-400">April 1, 2026</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-semibold text-dark">{user?.name}</p>
              <p className="text-xs text-gray-400">Team Outing 2026</p>
            </div>
            <button
              onClick={logout}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
              title="Logout"
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
                    ? 'bg-primary text-white shadow-md'
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
        {activeTab === 'home' && (
          <div className="space-y-8">
            {/* Countdown */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="card text-center py-8"
            >
              <CountdownTimer targetDate={config?.outingDate || '2026-04-01T09:00:00.000Z'} />
            </motion.div>

            {/* Event Info */}
            {config && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="card"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-primary-50 rounded-2xl">
                    <MapPin size={24} className="text-primary" />
                  </div>
                  <div>
                    <h3 className="font-display text-xl font-bold text-dark mb-1">
                      {config.venueName || 'Venue TBD'}
                    </h3>
                    {config.venueAddress && (
                      <p className="text-gray-500 text-sm mb-3">{config.venueAddress}</p>
                    )}
                    {config.description && (
                      <p className="text-gray-600 text-sm leading-relaxed">{config.description}</p>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* RSVP Card */}
            <RSVPCard />

            {/* RSVP Stats */}
            {counts && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="grid grid-cols-3 gap-4"
              >
                <div className="card-flat text-center">
                  <p className="text-3xl font-bold text-accent">{counts.attending}</p>
                  <p className="text-xs text-gray-500 mt-1">Going ✅</p>
                </div>
                <div className="card-flat text-center">
                  <p className="text-3xl font-bold text-gray-400">{counts.notAttending}</p>
                  <p className="text-xs text-gray-500 mt-1">Not Going</p>
                </div>
                <div className="card-flat text-center">
                  <p className="text-3xl font-bold text-secondary-600">{counts.pending}</p>
                  <p className="text-xs text-gray-500 mt-1">Pending</p>
                </div>
              </motion.div>
            )}

            {/* Digital Ticket */}
            {myRsvp?.attending && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="bg-gradient-to-r from-primary via-primary-500 to-accent rounded-3xl p-6 text-white relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
                <div className="relative flex items-center gap-4">
                  <Ticket size={32} className="opacity-80" />
                  <div>
                    <p className="text-white/70 text-xs uppercase tracking-wider mb-1">Your Digital Ticket</p>
                    <p className="font-display text-xl font-bold">{user?.name}</p>
                    <p className="text-white/80 text-sm">April 1, 2026</p>
                  </div>
                </div>
                <div className="relative mt-4 pt-4 border-t border-white/20 flex items-center justify-between">
                  <span className="text-white/60 text-xs">🎫 ADMITTED ONE</span>
                  <span className="font-display font-bold text-lg">YOU'RE GOING! 🎉</span>
                </div>
              </motion.div>
            )}
          </div>
        )}

        {activeTab === 'photos' && (
          <div className="space-y-6">
            <PhotoUploader onUpload={fetchPhotos} />

            {/* Leaderboard */}
            {leaderboard && (leaderboard.mostUploads.length > 0 || leaderboard.mostLiked.length > 0) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="card"
              >
                <h3 className="font-display text-lg font-bold text-dark mb-4 flex items-center gap-2">
                  <Trophy size={20} className="text-secondary" />
                  Leaderboard
                </h3>
                {leaderboard.mostUploads.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-500 mb-2">📸 Most Photos Uploaded</p>
                    <div className="flex gap-3 overflow-x-auto">
                      {leaderboard.mostUploads.map((item, i) => (
                        <div key={i} className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2 min-w-max">
                          <span className="text-lg">{i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}</span>
                          <span className="text-sm font-medium">{item.user?.name}</span>
                          <span className="text-xs text-gray-400">({item.count})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            <PhotoGallery photos={photos} onRefresh={fetchPhotos} />
          </div>
        )}

        {activeTab === 'messages' && <MessageBoard />}

        {activeTab === 'polls' && (
          <div className="space-y-6">
            <h2 className="section-title">Active Polls</h2>
            {polls.length === 0 ? (
              <div className="card text-center py-12">
                <BarChart3 size={40} className="mx-auto text-gray-300 mb-3" />
                <p className="text-gray-400">No active polls right now</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {polls.map((poll) => (
                  <PollWidget key={poll.id} poll={poll} />
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
