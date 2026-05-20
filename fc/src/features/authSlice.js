import { createSlice } from '@reduxjs/toolkit';

// Safe user parsing
const getStoredUser = () => {
  try {
    const user = localStorage.getItem('user');

    if (!user || user === 'undefined') {
      return null;
    }

    return JSON.parse(user);
  } catch (error) {
    return null;
  }
};

const initialState = {
  user: getStoredUser(),
  token: localStorage.getItem('token') || null,
  isAuthenticated: !!localStorage.getItem('token'),
  loading: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,

  reducers: {
    loginSuccess: (state, action) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;

      localStorage.setItem('token', action.payload.token);
      localStorage.setItem(
        'user',
        JSON.stringify(action.payload.user)
      );
    },

    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;

      localStorage.removeItem('token');
      localStorage.removeItem('user');
    },

    setUser: (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = true;

      localStorage.setItem(
        'user',
        JSON.stringify(action.payload)
      );
    },
  },
});

export const {
  loginSuccess,
  logout,
  setUser,
} = authSlice.actions;

export default authSlice.reducer;