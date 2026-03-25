import { useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Star, Send, MessageSquare, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import * as db from '../../lib/localDB';
import { useAuthStore } from '../../store/authStore';
import { timeAgo, getInitials, generateAvatarColor } from '../../lib/utils';
import type { Feedback, FeedbackCategory } from '../../types';

const feedbackSchema = z.object({
  rating: z.number().min(1, 'Please select a rating').max(5),
  message: z.string().min(10, 'Message must be at least 10 characters').max(1000),
  category: z.string().default('GENERAL'),
  isAnonymous: z.boolean().default(false),
});

type FeedbackFormData = z.infer<typeof feedbackSchema>;

const CATEGORIES: { value: FeedbackCategory; label: string; icon: string }[] = [
  { value: 'GENERAL', label: 'General', icon: '💬' },
  { value: 'VENUE', label: 'Venue', icon: '🏖️' },
  { value: 'FOOD', label: 'Food', icon: '🍕' },
  { value: 'ACTIVITIES', label: 'Activities', icon: '🎮' },
  { value: 'TEAM', label: 'Team', icon: '👥' },
  { value: 'SUGGESTIONS', label: 'Suggestions', icon: '💡' },
];

export function FeedbackForm({ onSubmit }: { onSubmit: () => void }) {
  const [rating, setRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FeedbackFormData>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: { rating: 0, category: 'GENERAL', isAnonymous: false },
  });

  const isAnonymous = watch('isAnonymous');

  const submitFeedback = async (data: FeedbackFormData) => {
    setIsSubmitting(true);
    try {
      const user = useAuthStore.getState().user;
      await db.submitFeedback(data, user?.id || '');
      toast.success('Feedback submitted! Thank you! 🙏');
      reset();
      setRating(0);
      onSubmit();
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card"
    >
      <h3 className="font-display text-lg font-bold text-dark mb-4 flex items-center gap-2">
        <MessageSquare size={20} className="text-primary" />
        Share Your Feedback
      </h3>

      <form onSubmit={handleSubmit(submitFeedback)} className="space-y-4">
        {/* Star Rating */}
        <div>
          <label className="text-sm font-medium text-gray-600 block mb-2">Rating</label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <motion.button
                key={star}
                type="button"
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
                onMouseEnter={() => setHoveredStar(star)}
                onMouseLeave={() => setHoveredStar(0)}
                onClick={() => {
                  setRating(star);
                  setValue('rating', star);
                }}
                className="focus:outline-none"
              >
                <Star
                  size={32}
                  className={`transition-colors ${
                    star <= (hoveredStar || rating)
                      ? 'text-secondary fill-secondary'
                      : 'text-gray-200'
                  }`}
                />
              </motion.button>
            ))}
          </div>
          {errors.rating && <p className="text-red-400 text-xs mt-1">{errors.rating.message}</p>}
        </div>

        {/* Category */}
        <div>
          <label className="text-sm font-medium text-gray-600 block mb-2">Category</label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <label
                key={cat.value}
                className={`cursor-pointer px-3 py-1.5 rounded-full text-sm font-medium transition-all border ${
                  watch('category') === cat.value
                    ? 'border-primary bg-primary-50 text-primary-700'
                    : 'border-gray-200 text-gray-500 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  value={cat.value}
                  {...register('category')}
                  className="sr-only"
                />
                {cat.icon} {cat.label}
              </label>
            ))}
          </div>
        </div>

        {/* Message */}
        <div>
          <label className="text-sm font-medium text-gray-600 block mb-2">Your Message</label>
          <textarea
            {...register('message')}
            rows={4}
            placeholder="Tell us about your experience..."
            className="input-field resize-none"
          />
          {errors.message && <p className="text-red-400 text-xs mt-1">{errors.message.message}</p>}
        </div>

        {/* Anonymous toggle */}
        <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl hover:bg-gray-50 transition-colors">
          <div
            className={`w-10 h-6 rounded-full transition-colors relative ${
              isAnonymous ? 'bg-primary' : 'bg-gray-200'
            }`}
          >
            <div
              className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                isAnonymous ? 'translate-x-4' : 'translate-x-0.5'
              }`}
            />
          </div>
          <input type="checkbox" {...register('isAnonymous')} className="sr-only" />
          <div className="flex items-center gap-1.5">
            <EyeOff size={16} className="text-gray-400" />
            <span className="text-sm text-gray-600">Post as Anonymous 🎭</span>
          </div>
        </label>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={isSubmitting}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          <Send size={18} />
          {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
        </motion.button>
      </form>
    </motion.div>
  );
}

export function FeedbackList({ feedbacks }: { feedbacks: Feedback[] }) {
  if (feedbacks.length === 0) {
    return (
      <div className="text-center py-8">
        <MessageSquare size={40} className="mx-auto text-gray-300 mb-3" />
        <p className="text-gray-400">No feedback yet — be the first to share!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {feedbacks.map((feedback, i) => (
        <motion.div
          key={feedback.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className="card-flat"
        >
          <div className="flex items-start gap-3">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                feedback.isAnonymous ? 'bg-gray-400' : generateAvatarColor(feedback.displayName)
              }`}
            >
              {feedback.isAnonymous ? '🎭' : getInitials(feedback.displayName)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-sm text-dark">{feedback.displayName}</span>
                <span className="badge bg-gray-100 text-gray-500 text-xs">{feedback.category}</span>
              </div>
              <div className="flex gap-0.5 mb-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    size={14}
                    className={s <= feedback.rating ? 'text-secondary fill-secondary' : 'text-gray-200'}
                  />
                ))}
              </div>
              <p className="text-gray-600 text-sm">{feedback.message}</p>
              <p className="text-gray-400 text-xs mt-2">{timeAgo(feedback.submittedAt)}</p>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
