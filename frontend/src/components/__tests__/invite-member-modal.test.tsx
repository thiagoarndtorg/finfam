import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { InviteMemberModal } from '../invite-member-modal';
import { I18nProvider } from '@/contexts/i18n-context';

const renderWithProvider = (component: React.ReactElement) => {
  return render(
    <I18nProvider>
      {component}
    </I18nProvider>
  );
};

describe('InviteMemberModal', () => {
  const mockOnInvite = jest.fn();
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should not render when isOpen is false', () => {
    renderWithProvider(
      <InviteMemberModal isOpen={false} onClose={mockOnClose} onInvite={mockOnInvite} />
    );
    
    expect(screen.queryByText(/convidar|invite/i)).not.toBeInTheDocument();
  });

  it('should render when isOpen is true', () => {
    renderWithProvider(
      <InviteMemberModal isOpen={true} onClose={mockOnClose} onInvite={mockOnInvite} />
    );
    
    const inviteElements = screen.getAllByText(/convidar|invite/i);
    expect(inviteElements.length).toBeGreaterThan(0);
  });

  it('should call onInvite with correct data when form is submitted', async () => {
    mockOnInvite.mockResolvedValueOnce(undefined);
    
    renderWithProvider(
      <InviteMemberModal isOpen={true} onClose={mockOnClose} onInvite={mockOnInvite} />
    );

    const emailInput = screen.getByLabelText(/email/i);
    const submitButton = screen.getByRole('button', { name: /enviar convite|send invitation/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnInvite).toHaveBeenCalledWith({
        email: 'test@example.com',
        role: 'member',
      });
    }, { timeout: 3000 });
  });

  it('should call onClose when cancel button is clicked', () => {
    renderWithProvider(
      <InviteMemberModal isOpen={true} onClose={mockOnClose} onInvite={mockOnInvite} />
    );

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should reset form after successful invite', async () => {
    mockOnInvite.mockResolvedValueOnce(undefined);

    renderWithProvider(
      <InviteMemberModal isOpen={true} onClose={mockOnClose} onInvite={mockOnInvite} />
    );

    const emailInput = screen.getByLabelText(/email/i);
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

    const submitButton = screen.getByRole('button', { name: /enviar convite|send invitation/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnInvite).toHaveBeenCalled();
    }, { timeout: 3000 });

    await waitFor(() => {
      expect(emailInput).toHaveValue('');
    }, { timeout: 3000 });
  });
});

