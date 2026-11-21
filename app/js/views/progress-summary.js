// The strip under the top bar: overall progress and one meter per grade.
import { replaceContent } from '../ui/dom.js';
import { renderMeter } from '../ui/grade-badge.js';
import { GRADES, percentOf, summarizeProgress } from '../logic/progress-math.js';

export function renderProgressSummary(root, context) {
  const summary = summarizeProgress(context.data.trophies, context.progress.isEarned);
  const overallLabel = `Overall · ${percentOf(summary.earned, summary.total)}%`;
  replaceContent(
    root,
    renderMeter({ label: overallLabel, earned: summary.earned, total: summary.total, className: 'meter-overall' }),
    GRADES.map((grade) =>
      renderMeter({
        label: grade[0].toUpperCase() + grade.slice(1),
        earned: summary.byGrade[grade].earned,
        total: summary.byGrade[grade].total,
        className: `meter-${grade}`,
      }),
    ),
  );
}
