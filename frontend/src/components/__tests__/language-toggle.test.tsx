import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { LanguageToggle } from '../language-toggle';
import { I18nProvider } from '@/contexts/i18n-context';

const renderWithProvider = (component: React.ReactElement) => {
  return render(
    <I18nProvider>
      {component}
    </I18nProvider>
  );
};

describe('LanguageToggle', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should render PT button initially', () => {
    renderWithProvider(<LanguageToggle />);
    const button = screen.getByText('PT');
    expect(button).toBeInTheDocument();
  });

  it('should toggle to EN when clicked', () => {
    renderWithProvider(<LanguageToggle />);
    const button = screen.getByText('PT');
    
    fireEvent.click(button);
    
    expect(screen.getByText('EN')).toBeInTheDocument();
  });

  it('should toggle back to PT when clicked again', () => {
    renderWithProvider(<LanguageToggle />);
    const button = screen.getByText('PT');
    
    fireEvent.click(button);
    expect(screen.getByText('EN')).toBeInTheDocument();
    
    fireEvent.click(screen.getByText('EN'));
    expect(screen.getByText('PT')).toBeInTheDocument();
  });

  it('should persist language preference in localStorage', () => {
    renderWithProvider(<LanguageToggle />);
    const button = screen.getByText('PT');
    
    fireEvent.click(button);
    
    expect(localStorage.getItem('locale')).toBe('en-US');
  });
});

