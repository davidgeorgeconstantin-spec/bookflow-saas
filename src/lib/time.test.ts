import { describe, expect, it } from 'vitest';
import { addDaysKey, dateKeyIn, tzOffsetMinutes, weekdayIn, zonedToUtc } from './time';

describe('time zones', () => {
  it('knows the Bucharest offset in winter (+2) and summer (+3)', () => {
    expect(tzOffsetMinutes(new Date('2026-01-15T12:00:00Z'), 'Europe/Bucharest')).toBe(120);
    expect(tzOffsetMinutes(new Date('2026-07-15T12:00:00Z'), 'Europe/Bucharest')).toBe(180);
  });

  it('converts a local time to UTC (DST aware)', () => {
    expect(zonedToUtc('2026-11-24', '09:00', 'Europe/Bucharest').toISOString()).toBe('2026-11-24T07:00:00.000Z');
    expect(zonedToUtc('2026-07-01', '09:00', 'Europe/Bucharest').toISOString()).toBe('2026-07-01T06:00:00.000Z');
    expect(zonedToUtc('2026-11-24', '09:00', 'America/New_York').toISOString()).toBe('2026-11-24T14:00:00.000Z');
  });

  it('finds the local calendar day of an instant', () => {
    // 23:30 UTC is already the next day in Bucharest
    expect(dateKeyIn(new Date('2026-11-23T23:30:00Z'), 'Europe/Bucharest')).toBe('2026-11-24');
    expect(dateKeyIn(new Date('2026-11-23T23:30:00Z'), 'Europe/London')).toBe('2026-11-23');
  });

  it('adds days across months and gets weekdays', () => {
    expect(addDaysKey('2026-11-30', 1)).toBe('2026-12-01');
    expect(addDaysKey('2026-03-01', -1)).toBe('2026-02-28');
    expect(weekdayIn('2026-11-23')).toBe(1); // Monday
  });
});
