'use client';

import React, { useEffect, useState } from 'react';

const IMAGE_SETS = [
  [
    'https://picsum.photos/seed/cr1/400/600',
    'https://picsum.photos/seed/cr2/400/400',
    'https://picsum.photos/seed/cr3/400/500',
    'https://picsum.photos/seed/cr4/400/350',
    'https://picsum.photos/seed/cr5/400/600',
    'https://picsum.photos/seed/cr6/400/400',
    'https://picsum.photos/seed/cr7/400/550',
    'https://picsum.photos/seed/cr8/400/400',
    'https://picsum.photos/seed/cr9/400/600',
    'https://picsum.photos/seed/cr10/400/350',
    'https://picsum.photos/seed/cr11/400/500',
    'https://picsum.photos/seed/cr12/400/450',
    'https://picsum.photos/seed/cr13/400/600',
    'https://picsum.photos/seed/cr14/400/350',
    'https://picsum.photos/seed/cr15/400/500',
    'https://picsum.photos/seed/cr16/400/400',
  ],
  [
    'https://picsum.photos/seed/rev1/400/500',
    'https://picsum.photos/seed/rev2/400/600',
    'https://picsum.photos/seed/rev3/400/400',
    'https://picsum.photos/seed/rev4/400/550',
    'https://picsum.photos/seed/rev5/400/400',
    'https://picsum.photos/seed/rev6/400/600',
    'https://picsum.photos/seed/rev7/400/350',
    'https://picsum.photos/seed/rev8/400/500',
    'https://picsum.photos/seed/rev9/400/450',
    'https://picsum.photos/seed/rev10/400/600',
    'https://picsum.photos/seed/rev11/400/400',
    'https://picsum.photos/seed/rev12/400/500',
    'https://picsum.photos/seed/rev13/400/350',
    'https://picsum.photos/seed/rev14/400/600',
    'https://picsum.photos/seed/rev15/400/400',
    'https://picsum.photos/seed/rev16/400/550',
  ],
  [
    'https://picsum.photos/seed/vid1/400/600',
    'https://picsum.photos/seed/vid2/400/350',
    'https://picsum.photos/seed/vid3/400/500',
    'https://picsum.photos/seed/vid4/400/600',
    'https://picsum.photos/seed/vid5/400/400',
    'https://picsum.photos/seed/vid6/400/550',
    'https://picsum.photos/seed/vid7/400/600',
    'https://picsum.photos/seed/vid8/400/350',
    'https://picsum.photos/seed/vid9/400/500',
    'https://picsum.photos/seed/vid10/400/400',
    'https://picsum.photos/seed/vid11/400/600',
    'https://picsum.photos/seed/vid12/400/350',
    'https://picsum.photos/seed/vid13/400/500',
    'https://picsum.photos/seed/vid14/400/450',
    'https://picsum.photos/seed/vid15/400/600',
    'https://picsum.photos/seed/vid16/400/400',
  ]
];

export default function BackgroundGrid() {
  const [activeSetIndex, setActiveSetIndex] = useState(0);
  const [opacity, setOpacity] = useState(0.38);

  useEffect(() => {
    const interval = setInterval(() => {
      // Step 1: Fade out
      setOpacity(0.1);

      // Step 2: Swap images and fade in after opacity transition
      setTimeout(() => {
        setActiveSetIndex((prev) => (prev + 1) % IMAGE_SETS.length);
        setOpacity(0.38);
      }, 800);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const currentSet = IMAGE_SETS[activeSetIndex];

  return (
    <div className="bg-container" aria-hidden="true">
      <div className="bg-overlay-dark" />
      <div className="bg-overlay-purple" />
      <div className="bg-overlay-grad" />
      <div
        className="grid-drift-container grid-drift-animated"
        style={{ opacity }}
      >
        {currentSet.map((url, index) => (
          <div className="grid-image-wrapper" key={index}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="" loading="lazy" />
          </div>
        ))}
      </div>
    </div>
  );
}
