import { motion } from 'framer-motion';
import { BarChart3, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { usePollStore } from '../../store/pollStore';
import type { Poll } from '../../types';

export default function PollWidget({ poll }: { poll: Poll }) {
  const { vote } = usePollStore();
  const totalVotes = poll.options.reduce((sum, o) => sum + o.voteCount, 0);
  const hasVoted = !!poll.userVote;

  const handleVote = async (optionId: string) => {
    try {
      await vote(poll.id, optionId);
      toast.success('Vote recorded! 🗳️');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to vote');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card"
    >
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 size={20} className="text-primary" />
        <h3 className="font-display text-lg font-bold text-dark">{poll.question}</h3>
      </div>

      <div className="space-y-3">
        {poll.options.map((option) => {
          const percentage = totalVotes > 0 ? Math.round((option.voteCount / totalVotes) * 100) : 0;
          const isSelected = poll.userVote === option.id;

          return (
            <motion.button
              key={option.id}
              onClick={() => handleVote(option.id)}
              disabled={false}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className={`w-full relative overflow-hidden rounded-xl p-3 text-left transition-all border-2 ${
                isSelected
                  ? 'border-primary bg-primary-50'
                  : 'border-gray-100 hover:border-gray-200 bg-white'
              }`}
            >
              {hasVoted && (
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className={`absolute inset-y-0 left-0 ${
                    isSelected ? 'bg-primary/10' : 'bg-gray-50'
                  }`}
                />
              )}
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isSelected && <Check size={16} className="text-primary" />}
                  <span className={`text-sm font-medium ${isSelected ? 'text-primary-700' : 'text-gray-700'}`}>
                    {option.text}
                  </span>
                </div>
                {hasVoted && (
                  <span className="text-xs font-semibold text-gray-400">
                    {percentage}% ({option.voteCount})
                  </span>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>

      <p className="text-xs text-gray-400 mt-3 text-center">
        {totalVotes} vote{totalVotes !== 1 ? 's' : ''} total
        {hasVoted && ' · click to change your vote'}
      </p>
    </motion.div>
  );
}
