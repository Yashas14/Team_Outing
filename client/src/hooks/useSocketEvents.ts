import { useEffect } from 'react';
import { getSocket } from '../lib/socket';
import { useRsvpStore } from '../store/rsvpStore';
import { usePollStore } from '../store/pollStore';

export function useSocketEvents() {
  const setCounts = useRsvpStore((s) => s.setCounts);
  const updatePollResults = usePollStore((s) => s.updatePollResults);

  useEffect(() => {
    const socket = getSocket();

    socket.on('rsvp:updated', (counts) => {
      setCounts(counts);
    });

    socket.on('poll:vote', ({ pollId, results }) => {
      updatePollResults(pollId, results);
    });

    return () => {
      socket.off('rsvp:updated');
      socket.off('poll:vote');
    };
  }, [setCounts, updatePollResults]);
}
