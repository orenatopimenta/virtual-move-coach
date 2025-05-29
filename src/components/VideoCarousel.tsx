import React, { useState, useEffect } from 'react';

export interface VideoItem {
  src: string;
  alt?: string;
}

interface VideoCarouselProps {
  videos: VideoItem[];
  className?: string;
  style?: React.CSSProperties;
}

export const VideoCarousel: React.FC<VideoCarouselProps> = ({ videos, className = '', style }) => {
  const [current, setCurrent] = useState(0);
  const [opacity, setOpacity] = useState(1);
  const [dragging, setDragging] = useState(false);
  const touch = React.useRef<{startX: number, lastX: number, dragging: boolean}>({startX: 0, lastX: 0, dragging: false});
  useEffect(() => {
    const interval = setInterval(() => {
      setOpacity(0);
      setTimeout(() => {
        setCurrent((prev) => (prev + 1) % videos.length);
        setOpacity(1);
      }, 800);
    }, 5000);
    return () => clearInterval(interval);
  }, [videos.length]);
  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    const x = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    touch.current.startX = x;
    touch.current.lastX = x;
    touch.current.dragging = true;
    setDragging(true);
  };
  const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!touch.current.dragging) return;
    const x = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    touch.current.lastX = x;
  };
  const handleTouchEnd = () => {
    if (!touch.current.dragging) return;
    const delta = touch.current.lastX - touch.current.startX;
    if (Math.abs(delta) > 40) {
      setOpacity(0);
      setTimeout(() => {
        if (delta < 0) {
          setCurrent((prev) => (prev + 1) % videos.length);
        } else {
          setCurrent((prev) => (prev - 1 + videos.length) % videos.length);
        }
        setOpacity(1);
      }, 200);
    }
    touch.current.dragging = false;
    setDragging(false);
  };
  return (
    <section className={`formfit-container flex justify-center py-8 ${className}`} style={style}>
      <div
        className="w-[360px] h-[240px] bg-white rounded-2xl shadow-xl flex items-center justify-center text-center mx-auto transition-opacity duration-700 select-none relative"
        style={{ opacity }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleTouchStart}
        onMouseMove={dragging ? handleTouchMove : undefined}
        onMouseUp={handleTouchEnd}
        onMouseLeave={handleTouchEnd}
      >
        <video
          src={videos[current].src}
          className="w-full h-full object-contain rounded-xl"
          autoPlay
          loop
          muted
          playsInline
        />
        <div className="absolute bottom-3 right-4 flex gap-2">
          {videos.map((_, idx) => (
            <span
              key={idx}
              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${idx === current ? 'bg-formfit-blue scale-125' : 'bg-gray-300'}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}; 