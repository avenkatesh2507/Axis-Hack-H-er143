import { useRef, useEffect, forwardRef, useState } from 'react';

const HorizontalScroller = forwardRef(function HorizontalScroller({ children, className = '' }, ref) {
  const innerRef = useRef(null);
  const containerRef = ref || innerRef;
  const contentRef = useRef(null);
  const [transform, setTransform] = useState({ x: 0, y: 0 });
  const velocityRef = useRef({ x: 0, y: 0 });
  const isDownRef = useRef(false);
  const startRef = useRef({ x: 0, y: 0 });
  const lastRef = useRef({ x: 0, y: 0 });
  const animationRef = useRef(null);

  // Momentum/inertia scrolling
  const applyMomentum = () => {
    const friction = 0.95;
    velocityRef.current.x *= friction;
    velocityRef.current.y *= friction;

    if (Math.abs(velocityRef.current.x) > 0.1 || Math.abs(velocityRef.current.y) > 0.1) {
      setTransform(prev => ({
        x: prev.x + velocityRef.current.x,
        y: prev.y + velocityRef.current.y,
      }));
      animationRef.current = requestAnimationFrame(applyMomentum);
    }
  };

  useEffect(() => {
    const el = containerRef.current;
    const content = contentRef.current;
    if (!el || !content) return;

    const onMouseDown = (e) => {
      isDownRef.current = true;
      el.classList.add('cursor-grabbing');
      startRef.current = { x: e.clientX, y: e.clientY };
      lastRef.current = { x: e.clientX, y: e.clientY };
      velocityRef.current = { x: 0, y: 0 };
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };

    const onMouseMove = (e) => {
      if (!isDownRef.current) return;
      e.preventDefault();

      const dx = e.clientX - lastRef.current.x;
      const dy = e.clientY - lastRef.current.y;

      velocityRef.current = { x: dx, y: dy };
      lastRef.current = { x: e.clientX, y: e.clientY };

      setTransform(prev => ({
        x: prev.x + dx,
        y: prev.y + dy,
      }));
    };

    const onMouseUp = () => {
      isDownRef.current = false;
      el.classList.remove('cursor-grabbing');
      applyMomentum();
    };

    const onTouchStart = (e) => {
      isDownRef.current = true;
      startRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      lastRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      velocityRef.current = { x: 0, y: 0 };
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };

    const onTouchMove = (e) => {
      if (!isDownRef.current) return;

      const dx = e.touches[0].clientX - lastRef.current.x;
      const dy = e.touches[0].clientY - lastRef.current.y;

      velocityRef.current = { x: dx, y: dy };
      lastRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };

      setTransform(prev => ({
        x: prev.x + dx,
        y: prev.y + dy,
      }));
    };

    const onTouchEnd = () => {
      isDownRef.current = false;
      applyMomentum();
    };

    el.addEventListener('mousedown', onMouseDown);
    el.addEventListener('mousemove', onMouseMove);
    el.addEventListener('mouseup', onMouseUp);
    el.addEventListener('mouseleave', onMouseUp);
    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: true });
    el.addEventListener('touchend', onTouchEnd);

    return () => {
      el.removeEventListener('mousedown', onMouseDown);
      el.removeEventListener('mousemove', onMouseMove);
      el.removeEventListener('mouseup', onMouseUp);
      el.removeEventListener('mouseleave', onMouseUp);
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [containerRef]);

  return (
    <div
      ref={containerRef}
      className={`diagonal-scroller ${className} overflow-hidden`}
      style={{ width: '100%', height: '100%' }}
    >
      <div
        ref={contentRef}
        style={{
          transform: `translate(${transform.x}px, ${transform.y}px)`,
          transition: isDownRef.current ? 'none' : 'none',
        }}
      >
        {children}
      </div>
    </div>
  );
});

export default HorizontalScroller;


