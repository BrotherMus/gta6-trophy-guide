// Earned counts overall and per grade, as plain numbers for the meters.

export const GRADES = ['platinum', 'gold', 'silver', 'bronze'];

export function summarizeProgress(trophies, isEarned) {
  const byGrade = Object.fromEntries(GRADES.map((grade) => [grade, { earned: 0, total: 0 }]));
  let earned = 0;
  for (const trophy of trophies) {
    const bucket = byGrade[trophy.grade];
    bucket.total += 1;
    if (isEarned(trophy.id)) {
      bucket.earned += 1;
      earned += 1;
    }
  }
  return { earned, total: trophies.length, byGrade };
}

export function percentOf(part, whole) {
  return whole === 0 ? 0 : Math.round((part / whole) * 100);
}
