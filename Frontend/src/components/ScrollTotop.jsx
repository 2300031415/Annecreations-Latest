'use client'
import React, { useState, useEffect } from 'react';
import { FaArrowUp } from 'react-icons/fa'; // Import the arrow icon

const ScrollToTop = () => {
  const [isVisible, setIsVisible] = useState(false);

  // Show button when page is scrolled down
  const toggleVisibility = () => {
    if (window.pageYOffset > 300) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  };

  // Scroll to top smoothly
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  useEffect(() => {
    window.addEventListener('scroll', toggleVisibility);
    return () => {
      window.removeEventListener('scroll', toggleVisibility);
    };
  }, []);

  return (
    <div className="scroll-to-top">
      {isVisible && (
        <button onClick={scrollToTop} style={styles.button}>
          <FaArrowUp size={20} /> {/* Using react-icon */}
        </button>
      )}
    </div>
  );
};

// Simple inline styles for the button
const styles = {
  button: {
    position: 'fixed',
    bottom: '50px',
    right: '20px',
    padding: '10px',
    fontSize: '18px',
    borderRadius: '50%',
    border: 'none',
    backgroundColor: 'var(--secondary)',
    color: 'var(--primary)',
    cursor: 'pointer',
    zIndex: 100,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
};

export default ScrollToTop;
