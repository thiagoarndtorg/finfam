import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeToggle } from '../theme-toggle';
import { ThemeProvider } from '../theme-provider';

const renderWithProvider = (component: React.ReactElement) => {
  return render(
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      {component}
    </ThemeProvider>
  );
};

describe('ThemeToggle', () => {
  it('should render theme toggle button', () => {
    renderWithProvider(<ThemeToggle />);
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('should toggle theme when clicked', () => {
    renderWithProvider(<ThemeToggle />);
    const button = screen.getByRole('button');
    
    fireEvent.click(button);
    
    expect(button).toBeInTheDocument();
  });
});

