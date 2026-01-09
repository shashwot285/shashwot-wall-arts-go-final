import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to ALL requests automatically
api.interceptors.request.use(
  (config) => {
    const user = localStorage.getItem('user');
    
    if (user) {
      try {
        const userData = JSON.parse(user);
        const token = userData.token;
        
        if (token) {
          config.headers['x-auth-token'] = token;
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for better error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Artwork APIs
export const artworkAPI = {
  getAllArtworks: (sortBy) => {
    const params = sortBy ? { sort: sortBy } : {};
    return api.get('/artworks', { params });
  },
  getArtworkById: (id) => api.get(`/artworks/${id}`),
  getArtworksByArtist: (artistId) => api.get(`/artworks/artist/${artistId}`),
  searchArtworks: (searchTerm) => api.get('/artworks/search', { params: { q: searchTerm } })
};

// Artist APIs
export const artistAPI = {
  getAllArtists: () => api.get('/artists'),
  getArtistById: (id) => api.get(`/artists/${id}`)
};

// Auth APIs
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data)
};

// Booking APIs
export const bookingAPI = {
  createBooking: (data) => api.post('/bookings', data),
  getUserBookings: () => api.get('/bookings/my-bookings'),
  getAllBookings: () => api.get('/bookings/all-bookings'), 
    updateBookingStatus: (id, status) => api.patch(`/bookings/${id}/status`, { status }),
  getBookingById: (id) => api.get(`/bookings/${id}`)
};

// Helper function to get image URL
export const getImageURL = (imageName) => {
  if (!imageName) return 'https://via.placeholder.com/400x500?text=No+Image';
  
  // If already has /wall_arts/ prefix, return as is
  if (imageName.startsWith('/wall_arts/')) {
    return imageName;
  }
  
  // Add /wall_arts/ prefix
  return `/wall_arts/${imageName}`;
};

export default api;