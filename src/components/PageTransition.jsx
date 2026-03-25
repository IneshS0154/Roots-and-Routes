import React, { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

const PageTransition = ({ children }) => {
  const location = useLocation();
  const ref = useRef(null);

  useEffect(() => {
    // Re-trigger the animation on every route change
    if (ref.current) {
      ref.current.classList.remove('page-transition');
      // Force reflow so removing and adding the class triggers the animation again
      void ref.current.offsetWidth;
      ref.current.classList.add('page-transition');
    }
  }, [location.pathname]);

  return (
    <div ref={ref} className="page-transition" style={{ width: '100%', height: '100%' }}>
      {children}
    </div>
  );
};

export default PageTransition;
