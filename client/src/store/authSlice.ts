import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { UserRef } from '../types';

interface AuthState {
  token: string | null;
  user: UserRef | null;
}

const stored = localStorage.getItem('pulse-auth');
const initialState: AuthState = stored ? JSON.parse(stored) : { token: null, user: null };

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials(state, action: PayloadAction<{ token: string; user: UserRef }>) {
      state.token = action.payload.token;
      state.user = action.payload.user;
      localStorage.setItem('pulse-auth', JSON.stringify(state));
    },
    logout(state) {
      state.token = null;
      state.user = null;
      localStorage.removeItem('pulse-auth');
      localStorage.removeItem('pulse-business');
      localStorage.removeItem('pulse-timer');
    },
  },
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;
