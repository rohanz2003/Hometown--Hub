/**
 * components/ui/Button.test.jsx
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Button from './Button';

describe('Button', () => {
  it('renders its label and calls onClick', async () => {
    const onClick = jest.fn();
    render(<Button onClick={onClick}>Join community</Button>);

    await userEvent.click(screen.getByRole('button', { name: 'Join community' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('defaults to type="button" so it never submits a form by accident', () => {
    render(<Button>Save</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
  });

  it('blocks clicks and marks itself busy while loading', async () => {
    const onClick = jest.fn();
    render(
      <Button isLoading onClick={onClick}>
        Saving
      </Button>,
    );

    const button = screen.getByRole('button', { name: /saving/i });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');

    await userEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('renders as another element when asked, without button-only attributes', () => {
    render(
      <Button as="a" href="/communities">
        Browse
      </Button>,
    );

    const link = screen.getByRole('link', { name: 'Browse' });
    expect(link).toHaveAttribute('href', '/communities');
    expect(link).not.toHaveAttribute('type');
  });
});
