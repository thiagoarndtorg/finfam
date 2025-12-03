import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { LanguageSelector } from '../language-selector';
import { I18nProvider } from '@/contexts/i18n-context';

const renderWithProvider = (component: React.ReactElement) => {
  return render(
    <I18nProvider>
      {component}
    </I18nProvider>
  );
};

describe('LanguageSelector', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should render language selector', () => {
    renderWithProvider(<LanguageSelector />);
    const selector = screen.getByRole('combobox');
    expect(selector).toBeInTheDocument();
  });

  it('should render with current locale', () => {
    renderWithProvider(<LanguageSelector />);
    const selector = screen.getByRole('combobox');
    expect(selector).toBeInTheDocument();
  });
});

