import { describe, it, expect } from 'vitest';
import { axe } from 'vitest-axe';
import { render } from '@testing-library/react';
import { BankSection } from '@/components/emergency/BankSection';
import { SaveStatusBadge } from '@/components/emergency/SaveStatusBadge';
import { ChatChoices } from '@/components/chat/ChatChoices';

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

const noop = () => {};

// ---------------------------------------------------------------------------
// BankSection — form input label associations
// ---------------------------------------------------------------------------

describe('BankSection a11y', () => {
  it('passes axe audit with all labels associated', async () => {
    const { container } = render(
      <BankSection
        bankName=""
        bankCountryCode="+39"
        bankPhone=""
        onBankNameChange={noop}
        onBankCountryCodeChange={noop}
        onBankPhoneChange={noop}
      />,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('has sr-only labels for all inputs', () => {
    const { container } = render(
      <BankSection
        bankName=""
        bankCountryCode="+39"
        bankPhone=""
        onBankNameChange={noop}
        onBankCountryCodeChange={noop}
        onBankPhoneChange={noop}
      />,
    );
    const labels = container.querySelectorAll('label.sr-only');
    // 3 labels: bank name, country code, bank phone
    expect(labels.length).toBeGreaterThanOrEqual(3);
  });
});

// ---------------------------------------------------------------------------
// SaveStatusBadge — error-only announcement
// ---------------------------------------------------------------------------

describe('SaveStatusBadge a11y', () => {
  it('does NOT have aria-live on main container when idle', () => {
    const { container } = render(<SaveStatusBadge status="idle" />);
    const mainDiv = container.firstElementChild;
    expect(mainDiv?.getAttribute('aria-live')).toBeNull();
  });

  it('has assertive aria-live region for errors', () => {
    const { container } = render(<SaveStatusBadge status="error" />);
    const liveRegion = container.querySelector('[aria-live="assertive"]');
    expect(liveRegion).not.toBeNull();
    expect(liveRegion?.textContent).toContain('Salvataggio fallito');
  });

  it('has empty assertive region when status is saved (silent)', () => {
    const { container } = render(<SaveStatusBadge status="saved" />);
    const liveRegion = container.querySelector('[aria-live="assertive"]');
    expect(liveRegion).not.toBeNull();
    expect(liveRegion?.textContent?.trim()).toBe('');
  });
});

// ---------------------------------------------------------------------------
// ChatChoices — colorblind icon indicators
// ---------------------------------------------------------------------------

describe('ChatChoices a11y', () => {
  const mockOptions = [
    { id: 'a', text: 'Correct option', correct: true },
    { id: 'b', text: 'Wrong option', correct: false },
  ];

  it('passes axe audit', async () => {
    const { container } = render(
      <ChatChoices options={mockOptions} onSelect={noop} />,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('renders icons for correct and incorrect choices', () => {
    const { container } = render(
      <ChatChoices options={mockOptions} onSelect={noop} />,
    );
    // CheckCircle2 and XCircle render as SVGs
    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBeGreaterThanOrEqual(2);
  });

  it('has sr-only text for correct/incorrect status', () => {
    const { container } = render(
      <ChatChoices options={mockOptions} onSelect={noop} />,
    );
    const srOnlyElements = container.querySelectorAll('.sr-only');
    const texts = Array.from(srOnlyElements).map((el) => el.textContent);
    expect(texts).toContain('Risposta corretta');
    expect(texts).toContain('Risposta sbagliata');
  });
});
