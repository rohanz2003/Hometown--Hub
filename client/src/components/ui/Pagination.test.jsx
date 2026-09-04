/**
 * components/ui/Pagination.test.jsx
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Pagination from './Pagination';

const meta = (overrides = {}) => ({
  page: 1,
  limit: 10,
  total: 35,
  totalPages: 4,
  hasNextPage: true,
  hasPrevPage: false,
  ...overrides,
});

describe('Pagination', () => {
  it('renders nothing when there is only one page', () => {
    const { container } = render(
      <Pagination
        meta={meta({ totalPages: 1, hasNextPage: false })}
        page={1}
        onChange={() => {}}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('summarises the current position', () => {
    render(<Pagination meta={meta()} page={1} onChange={() => {}} />);
    expect(screen.getByText(/Page 1 of 4/)).toBeInTheDocument();
    expect(screen.getByText(/35 results/)).toBeInTheDocument();
  });

  it('disables Previous on the first page', () => {
    render(<Pagination meta={meta()} page={1} onChange={() => {}} />);
    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next' })).toBeEnabled();
  });

  it('marks the active page for assistive technology', () => {
    render(<Pagination meta={meta({ page: 2, hasPrevPage: true })} page={2} onChange={() => {}} />);
    expect(screen.getByRole('button', { name: '2' })).toHaveAttribute('aria-current', 'page');
  });

  it('reports the requested page', async () => {
    const onChange = jest.fn();
    render(<Pagination meta={meta()} page={1} onChange={onChange} />);

    await userEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(onChange).toHaveBeenCalledWith(2);

    await userEvent.click(screen.getByRole('button', { name: '3' }));
    expect(onChange).toHaveBeenCalledWith(3);
  });
});
