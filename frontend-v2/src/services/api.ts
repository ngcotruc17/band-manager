import axios from 'axios';

const getAPIUrl = (): string => {
  // 1. Ưu tiên tự động phát hiện IP trình duyệt khi truy cập từ LAN (192.168.x.x, localhost, 127.0.0.1)
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;

    const isLocalIP = 
      hostname === 'localhost' || 
      hostname === '127.0.0.1' || 
      /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname);

    if (isLocalIP) {
      return `http://${hostname}:5000/api`;
    }
  }

  // 2. Sử dụng biến môi trường nếu được cấu hình
  if (process.env.NEXT_PUBLIC_API_URL) {
    const raw = process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, '');
    return raw.endsWith('/api') ? raw : `${raw}/api`;
  }

  // 3. Mặc định dùng server Render nếu mở từ trang public
  return 'https://band-manager-s9tm.onrender.com/api';
};

const api = axios.create({
  baseURL: getAPIUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor tự động thêm Bearer token vào header cho mỗi request
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
