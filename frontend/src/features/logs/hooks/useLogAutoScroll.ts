import { useState, useCallback, RefObject } from 'react';

const SCROLL_THRESHOLD = 10; // Порог для определения "близости" к низу

interface UseLogAutoScrollParams {
  scrollContainerRef: RefObject<HTMLDivElement | null>;
}

export const useLogAutoScroll = ({ scrollContainerRef, }: UseLogAutoScrollParams) => {
  const [shouldFollow, setShouldFollow] = useState(true);

  const handleUserScroll = useCallback(() => {
    const scroller = scrollContainerRef.current;
    if (scroller) {
      const { scrollTop, scrollHeight, clientHeight } = scroller;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
      const isNearBottom = distanceFromBottom < SCROLL_THRESHOLD;

      if (isNearBottom && !shouldFollow) {
        setShouldFollow(true);
      } else if (!isNearBottom && shouldFollow) {
        setShouldFollow(false);
      }
    }
  }, [shouldFollow, scrollContainerRef]);

  const toggleFollowing = useCallback(() => {
    setShouldFollow(prevState => {
      const nextState = !prevState;
      if (nextState && scrollContainerRef.current) {
        const scroller = scrollContainerRef.current;
        scroller.scrollTop = scroller.scrollHeight;
      }
      return nextState;
    });
  }, [scrollContainerRef]);

  return {
    isFollowing: shouldFollow,
    handleUserScroll,
    toggleFollowing,
  };
};
