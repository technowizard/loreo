import { render, screen } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';

import { App } from './app';
import { server } from './tests/mocks/server';

describe('App', () => {
  it('renders the login shell when auth lookup fails', async () => {
    window.history.pushState({}, '', '/');

    server.use(
      http.get('http://localhost:3000/auth/user', () => {
        return new HttpResponse(null, { status: 401 });
      })
    );

    render(<App />);

    expect(await screen.findByRole('heading', { name: /welcome back/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });
});
