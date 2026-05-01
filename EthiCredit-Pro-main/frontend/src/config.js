// Central API configuration
// Uses VITE_API_URL env var if set, otherwise falls back to the Render backend
const API_BASE = import.meta.env.VITE_API_URL || 'https://ethicredit-pro.onrender.com';

export default API_BASE;
