/**
 * components/ui/ActivityChart.test.jsx
 *
 * The chart must never carry meaning in colour alone: it always renders a legend,
 * a per-bar accessible label, and a table view of the same numbers.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ActivityChart from './ActivityChart';

const series = (values) =>
  values.map((value, index) => ({
    date: `2026-09-${String(index + 1).padStart(2, '0')}`,
    posts: value,
    events: index % 2,
  }));

describe('ActivityChart', () => {
  it('renders nothing without data', () => {
    const { container } = render(<ActivityChart data={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('labels both series so colour is not the only cue', () => {
    render(<ActivityChart data={series([1, 2, 3])} />);
    expect(screen.getByText('Posts')).toBeInTheDocument();
    expect(screen.getByText('Events')).toBeInTheDocument();
  });

  it('gives every bar a readable label', () => {
    render(<ActivityChart data={series([4])} />);
    expect(screen.getByLabelText(/4 posts/)).toBeInTheDocument();
  });

  it('explains an all-zero series instead of drawing an empty plot', () => {
    render(<ActivityChart data={[{ date: '2026-09-01', posts: 0, events: 0 }]} />);
    expect(screen.getByText(/No posts or events yet/i)).toBeInTheDocument();
  });

  it('offers a table view of the same numbers', async () => {
    render(<ActivityChart data={series([5, 6])} />);

    const toggle = screen.getByRole('button', { name: /show the numbers/i });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');

    await userEvent.click(toggle);
    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Posts' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /hide the numbers/i })).toBeInTheDocument();
  });
});
