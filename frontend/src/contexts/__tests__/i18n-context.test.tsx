import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { I18nProvider, useI18n } from '../i18n-context';

const TestComponent = () => {
  const { t, locale, setLocale } = useI18n();
  
  return (
    <div>
      <div data-testid="locale">{locale}</div>
      <div data-testid="translation">{t('common.loading')}</div>
      <button onClick={() => setLocale('en-US')}>Change to EN</button>
    </div>
  );
};

describe('I18nContext', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should provide default locale pt-BR', () => {
    render(
      <I18nProvider>
        <TestComponent />
      </I18nProvider>
    );

    expect(screen.getByTestId('locale')).toHaveTextContent('pt-BR');
  });

  it('should translate text correctly', () => {
    render(
      <I18nProvider>
        <TestComponent />
      </I18nProvider>
    );

    expect(screen.getByTestId('translation')).toHaveTextContent('Carregando...');
  });

  it('should change locale when setLocale is called', () => {
    render(
      <I18nProvider>
        <TestComponent />
      </I18nProvider>
    );

    const changeButton = screen.getByText('Change to EN');
    fireEvent.click(changeButton);

    expect(screen.getByTestId('locale')).toHaveTextContent('en-US');
    expect(screen.getByTestId('translation')).toHaveTextContent('Loading...');
  });

  it('should format messages with parameters', () => {
    const TestComponentWithParams = () => {
      const { t } = useI18n();
      return <div data-testid="formatted">{t('dashboard.accountsSynced', { count: '5' })}</div>;
    };

    render(
      <I18nProvider>
        <TestComponentWithParams />
      </I18nProvider>
    );

    expect(screen.getByTestId('formatted')).toHaveTextContent('5 conta(s) sincronizada(s) com sucesso!');
  });
});

