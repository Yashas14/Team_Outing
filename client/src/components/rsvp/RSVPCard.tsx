import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ThumbsUp, ThumbsDown, X, CheckCircle2, Heart } from 'lucide-react';
import confetti from 'canvas-confetti';
import toast from 'react-hot-toast';
import { useRsvpStore } from '../../store/rsvpStore';
import { useAuthStore } from '../../store/authStore';

export default function RSVPCard() {
  const { myRsvp, submitRsvp, updateRsvp } = useRsvpStore();
  const user = useAuthStore((s) => s.user);
  const [showYesModal, setShowYesModal] = useState(false);
  const [showNoModal, setShowNoModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleYes = async () => {
    setIsSubmitting(true);
    try {
      if (myRsvp) {
        await updateRsvp(true);
      } else {
        await submitRsvp(true);
      }

      // Confetti explosion
      const end = Date.now() + 3000;
      const colors = ['#FF6B35', '#FFD166', '#06D6A0', '#FF69B4', '#00CED1'];
      const frame = () => {
        confetti({
          particleCount: 5,
          angle: 60,
          spread: 70,
          origin: { x: 0 },
          colors,
        });
        confetti({
          particleCount: 5,
          angle: 120,
          spread: 70,
          origin: { x: 1 },
          colors,
        });
        if (Date.now() < end) requestAnimationFrame(frame);
      };
      frame();

      setShowYesModal(true);
      setTimeout(() => setShowYesModal(false), 4000);
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit RSVP');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNo = async () => {
    setIsSubmitting(true);
    try {
      if (myRsvp) {
        await updateRsvp(false);
      } else {
        await submitRsvp(false);
      }
      setShowNoModal(true);
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit RSVP');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Already RSVP'd state
  if (myRsvp) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card text-center"
      >
        {myRsvp.attending ? (
          <>
            <div className="text-6xl mb-4">🎉</div>
            <h3 className="font-display text-2xl font-bold text-dark mb-2">You're IN! ✅</h3>
            <p className="text-gray-500 mb-6">
              Get ready for an amazing day, {user?.name?.split(' ')[0]}!
            </p>
            <button
              onClick={handleNo}
              disabled={isSubmitting}
              className="text-sm text-gray-400 hover:text-red-400 transition-colors underline"
            >
              Change my mind
            </button>
          </>
        ) : (
          <>
            <div className="text-6xl mb-4">💙</div>
            <h3 className="font-display text-2xl font-bold text-dark mb-2">We'll miss you 💙</h3>
            <p className="text-gray-500 mb-6">Hope to see you next time!</p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleYes}
              disabled={isSubmitting}
              className="btn-primary text-sm"
            >
              Actually, I want to come! 🎉
            </motion.button>
          </>
        )}

        {/* YES celebration modal */}
        <AnimatePresence>
          {showYesModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
              onClick={() => setShowYesModal(false)}
            >
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                transition={{ type: 'spring', damping: 15 }}
                className="bg-white rounded-4xl p-10 max-w-md mx-4 text-center shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="text-7xl mb-4">🎉</div>
                <h2 className="font-display text-3xl font-bold text-dark mb-3">Amazing!</h2>
                <p className="text-lg text-gray-600">
                  We're going to have SO much fun together!
                  <br />
                  Can't wait to see you there, <strong>{user?.name?.split(' ')[0]}</strong>! 🌴✨
                </p>
                <button
                  onClick={() => setShowYesModal(false)}
                  className="mt-6 btn-primary"
                >
                  <CheckCircle2 size={18} className="inline mr-2" />
                  Let's Go!
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* NO sad modal */}
        <AnimatePresence>
          {showNoModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
              onClick={() => setShowNoModal(false)}
            >
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                transition={{ type: 'spring', damping: 15 }}
                className="bg-white rounded-4xl p-10 max-w-md mx-4 text-center shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="text-7xl mb-4">😢</div>
                <h2 className="font-display text-3xl font-bold text-dark mb-3">
                  We'll miss you!
                </h2>
                <p className="text-lg text-gray-600">
                  Wishing you were joining us, <strong>{user?.name?.split(' ')[0]}</strong>...
                  <br />
                  Stay fun, we'll bring the memories back! 💙
                </p>
                <div className="flex gap-3 mt-6 justify-center">
                  <button
                    onClick={() => setShowNoModal(false)}
                    className="btn-ghost text-sm"
                  >
                    <X size={16} className="inline mr-1" /> Close
                  </button>
                  <button
                    onClick={() => {
                      setShowNoModal(false);
                      handleYes();
                    }}
                    className="btn-primary text-sm"
                  >
                    <Heart size={16} className="inline mr-1" /> Changed my mind!
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }

  // No RSVP yet
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card text-center overflow-hidden"
    >
      <div className="text-6xl mb-4">🎪</div>
      <h3 className="font-display text-2xl font-bold text-dark mb-2">
        Are you joining the fun?
      </h3>
      <p className="text-gray-500 mb-8">Let us know if you'll be there! 🎉</p>

      <div className="flex gap-4 justify-center">
        <motion.button
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleYes}
          disabled={isSubmitting}
          className="flex-1 max-w-[180px] py-4 bg-gradient-to-r from-accent to-accent-600 text-white 
                   rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl transition-all
                   disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <ThumbsUp size={22} />
          Yes! 🎉
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleNo}
          disabled={isSubmitting}
          className="flex-1 max-w-[180px] py-4 bg-gray-100 text-gray-600 
                   rounded-2xl font-bold text-lg hover:bg-gray-200 transition-all
                   disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <ThumbsDown size={22} />
          No 😢
        </motion.button>
      </div>

      {/* YES celebration modal */}
      <AnimatePresence>
        {showYesModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setShowYesModal(false)}
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ type: 'spring', damping: 15 }}
              className="bg-white rounded-4xl p-10 max-w-md mx-4 text-center shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-7xl mb-4">🎉</div>
              <h2 className="font-display text-3xl font-bold text-dark mb-3">Amazing!</h2>
              <p className="text-lg text-gray-600">
                We're going to have SO much fun together!
                <br />
                Can't wait to see you there, <strong>{user?.name?.split(' ')[0]}</strong>! 🌴✨
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* NO sad modal */}
      <AnimatePresence>
        {showNoModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setShowNoModal(false)}
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ type: 'spring', damping: 15 }}
              className="bg-white rounded-4xl p-10 max-w-md mx-4 text-center shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-7xl mb-4">😢</div>
              <h2 className="font-display text-3xl font-bold text-dark mb-3">
                We'll miss you so much!
              </h2>
              <p className="text-lg text-gray-600">
                Wishing you were joining us, <strong>{user?.name?.split(' ')[0]}</strong>...
                <br />
                Stay fun, we'll bring the memories back! 💙
              </p>
              <button
                onClick={() => setShowNoModal(false)}
                className="mt-6 btn-ghost"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
