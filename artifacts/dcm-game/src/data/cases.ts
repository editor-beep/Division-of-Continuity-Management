import day1Raw from './cases_day_01.json';
import day2Raw from './cases_day_02.json';
import day3Raw from './cases_day_03.json';
import { Case } from '../types';

export const allCases: Case[] = [
  ...(day1Raw.cases as Case[]),
  ...(day2Raw.cases as Case[]),
  ...(day3Raw.cases as Case[]),
];

export function getCasesForDay(
  day: number,
  clearanceLevel?: number,
  flags?: Record<string, boolean>
): Case[] {
  return allCases.filter((c) => {
    if (c.day !== day) return false;
    if (clearanceLevel !== undefined && c.clearance_required > clearanceLevel) return false;
    if (flags !== undefined && c.requires_flag !== '' && !flags[c.requires_flag]) return false;
    return true;
  });
}

export function getCaseById(id: string): Case | undefined {
  return allCases.find((c) => c.id === id);
}
