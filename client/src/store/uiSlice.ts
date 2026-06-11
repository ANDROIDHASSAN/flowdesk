import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UiState {
  /** active business id, or 'all' for the combined view */
  businessId: string;
}

const initialState: UiState = {
  businessId: localStorage.getItem('pulse-business') || 'all',
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setBusiness(state, action: PayloadAction<string>) {
      state.businessId = action.payload;
      localStorage.setItem('pulse-business', action.payload);
    },
  },
});

export const { setBusiness } = uiSlice.actions;
export default uiSlice.reducer;
