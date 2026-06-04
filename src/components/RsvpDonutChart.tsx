'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface RsvpDonutChartProps {
  confirmed: number;
  pending: number;
  declined: number;
}

const RADIUS = 70;
const STROKE_WIDTH = 18;
const CENTER = 100;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const GAP = 4; // px gap between segments

interface Segment {
  value: number;
  color: string;
  label: string;
}

export default function RsvpDonutChart({
  confirmed,
  pending,
  declined,
}: RsvpDonutChartProps) {
  const total = confirmed + pending + declined;

  const segments: Segment[] = [
    { value: confirmed, color: '#22964F', label: 'Confirmés' },
    { value: pending, color: '#DC8C28', label: 'En attente' },
    { value: declined, color: '#DC3545', label: 'Déclinés' },
  ];

  const activeSegments = segments.filter((s) => s.value > 0);
  const gapTotal = activeSegments.length > 1 ? activeSegments.length * GAP : 0;
  const usableCircumference = CIRCUMFERENCE - gapTotal;

  // Build arcs with start angles
  let cumulativeOffset = 0;
  const arcs = segments.map((segment) => {
    const dashLength =
      total > 0 ? (segment.value / total) * usableCircumference : 0;
    const startAngle =
      total > 0
        ? (cumulativeOffset / CIRCUMFERENCE) * 360 - 90
        : -90;

    const arc = {
      ...segment,
      dashLength,
      startAngle,
      dashOffset: CIRCUMFERENCE - dashLength,
    };

    if (segment.value > 0) {
      cumulativeOffset += dashLength + GAP;
    }

    return arc;
  });

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1rem',
      }}
    >
      {/* SVG Donut */}
      <svg viewBox="0 0 200 200" width="200" height="200">
        {/* Background track */}
        <circle
          cx={CENTER}
          cy={CENTER}
          r={RADIUS}
          fill="none"
          stroke="var(--border-light, rgba(255,255,255,0.05))"
          strokeWidth={STROKE_WIDTH}
        />

        {/* Segments */}
        {arcs.map((arc, i) => {
          if (arc.value === 0) return null;
          return (
            <motion.circle
              key={arc.label}
              cx={CENTER}
              cy={CENTER}
              r={RADIUS}
              fill="none"
              stroke={arc.color}
              strokeWidth={STROKE_WIDTH}
              strokeLinecap="round"
              strokeDasharray={`${arc.dashLength} ${CIRCUMFERENCE - arc.dashLength}`}
              initial={{ strokeDashoffset: CIRCUMFERENCE }}
              animate={{ strokeDashoffset: 0 }}
              transition={{
                duration: 1.2,
                ease: 'easeOut',
                delay: 0.3 + i * 0.1,
              }}
              transform={`rotate(${arc.startAngle} ${CENTER} ${CENTER})`}
            />
          );
        })}

        {/* Center text */}
        <text
          x={CENTER}
          y={total > 0 ? CENTER - 4 : CENTER}
          textAnchor="middle"
          dominantBaseline="central"
          style={{
            fontSize: '2rem',
            fontWeight: 700,
            fill: 'var(--text-primary, #fff)',
          }}
        >
          {total}
        </text>
        {total > 0 && (
          <text
            x={CENTER}
            y={CENTER + 18}
            textAnchor="middle"
            dominantBaseline="central"
            style={{
              fontSize: '0.7rem',
              fill: 'var(--text-muted, rgba(255,255,255,0.5))',
            }}
          >
            invités
          </text>
        )}
      </svg>

      {/* Legend */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '1.5rem',
        }}
      >
        {segments.map((segment) => (
          <div
            key={segment.label}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: segment.color,
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontSize: '0.75rem',
                color: 'var(--text-muted, rgba(255,255,255,0.5))',
              }}
            >
              {segment.label}
            </span>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                color: 'var(--text-primary, #fff)',
              }}
            >
              {segment.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
