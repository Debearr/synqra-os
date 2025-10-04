/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef, useState } from 'react';
import styles from './ChaosCarousel.module.css';

const slides = [
  { id: 1, title: 'Chaos Carousel', subtitle: 'Where entropy meets elegance', color: '#9b5de5' },
  { id: 2, title: 'Fractals & Flux', subtitle: 'Patterns within patterns', color: '#f15bb5' },
  { id: 3, title: 'Anomaly Alley', subtitle: 'Beauty in disorder', color: '#00bbf9' },
];

export default function ChaosCarousel() {
  const [index, setIndex] = useState(0);
  const containerRef = useRef(null);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowRight') setIndex((i) => (i + 1) % slides.length);
      if (e.key === 'ArrowLeft') setIndex((i) => (i - 1 + slides.length) % slides.length);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className={styles.viewport} ref={containerRef}>
      <div className={styles.track} style={{ transform: `translateX(-${index * 100}%)` }}>
        {slides.map((s) => (
          <section key={s.id} className={styles.slide} style={{ background: s.color }}>
            <div className={styles.content}>
              <h1 className={styles.title}>{s.title}</h1>
              <p className={styles.subtitle}>{s.subtitle}</p>
            </div>
          </section>
        ))}
      </div>
      <div className={styles.controls}>
        <button onClick={() => setIndex((i) => (i - 1 + slides.length) % slides.length)}>Prev</button>
        <span className={styles.dots}>
          {slides.map((s, i) => (
            <i key={s.id} className={i === index ? styles.dotActive : styles.dot} />
          ))}
        </span>
        <button onClick={() => setIndex((i) => (i + 1) % slides.length)}>Next</button>
      </div>
    </div>
  );
}
