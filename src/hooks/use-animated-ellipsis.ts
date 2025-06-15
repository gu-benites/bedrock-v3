import { useState, useEffect } from 'react';

export const useAnimatedEllipsis = () => {
  const [ellipsis, setEllipsis] = useState('');

  useEffect(() => {
    const states = ['', ' .', ' ..', ' ...'];
    let index = 0;

    const interval = setInterval(() => {
      setEllipsis(states[index] || '');
      index = (index + 1) % states.length;
    }, 300);

    return () => clearInterval(interval);
  }, []);

  return ellipsis;
};