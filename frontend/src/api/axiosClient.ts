import axios from 'axios';
import { mockBackend } from './mockData';

// Offline demo data is only used when explicitly enabled (VITE_STANDALONE=true).
// Otherwise real backend errors must surface instead of being masked by fake data.
const STANDALONE_MODE = (import.meta as any).env?.VITE_STANDALONE === 'true';

const axiosClient = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Standard 401 handling (a failed login attempt must not hard-redirect)
    const requestUrl: string = error.config?.url || '';
    const isAuthAttempt = requestUrl.includes('/auth/login') || requestUrl.includes('/auth/register');
    if (error.response?.status === 401 && !isAuthAttempt) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login' && window.location.pathname !== '/signup') {
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }

    // Offline / Standalone Mock Fallback
    const isNetworkError =
      !error.response ||
      error.code === 'ERR_NETWORK' ||
      error.code === 'ECONNABORTED' ||
      error.response?.status >= 500;

    if (STANDALONE_MODE && isNetworkError && error.config) {
      const url = error.config.url || '';
      const method = (error.config.method || 'get').toLowerCase();
      let reqData = {};
      try {
        reqData = error.config.data ? JSON.parse(error.config.data) : {};
      } catch (_) {}

      try {
        let mockResult: any = null;

        // Auth
        if (url.includes('/auth/register') && method === 'post') {
          mockResult = mockBackend.register(reqData as any);
        } else if (url.includes('/auth/login') && method === 'post') {
          mockResult = mockBackend.login(reqData as any);
        } else if (url.includes('/auth/me') && method === 'get') {
          mockResult = mockBackend.getCurrentUser();
        } else if (url.includes('/auth/profile') && method === 'put') {
          mockResult = mockBackend.updateProfile(reqData as any);
        }

        // Operating Rooms
        else if (url.includes('/rooms/active') && method === 'get') {
          mockResult = mockBackend.getActiveRooms();
        } else if (url.match(/\/rooms\/\d+/) && method === 'get') {
          const id = parseInt(url.split('/rooms/')[1]);
          mockResult = mockBackend.getRoomById(id);
        } else if (url.match(/\/rooms\/\d+/) && method === 'put') {
          const id = parseInt(url.split('/rooms/')[1]);
          mockResult = mockBackend.updateRoom(id, reqData);
        } else if (url.match(/\/rooms\/\d+/) && method === 'delete') {
          const id = parseInt(url.split('/rooms/')[1]);
          mockResult = mockBackend.deleteRoom(id);
        } else if (url.includes('/rooms') && method === 'get') {
          mockResult = mockBackend.getRooms();
        } else if (url.includes('/rooms') && method === 'post') {
          mockResult = mockBackend.createRoom(reqData);
        }

        // Staff
        else if (url.includes('/staff/active') && method === 'get') {
          mockResult = mockBackend.getActiveStaff();
        } else if (url.includes('/shifts') && method === 'get') {
          const id = parseInt(url.split('/staff/')[1]?.split('/')[0] || '1');
          mockResult = mockBackend.getStaffShifts(id);
        } else if (url.includes('/shifts') && method === 'post') {
          const id = parseInt(url.split('/staff/')[1]?.split('/')[0] || '1');
          mockResult = mockBackend.addStaffShift(id, reqData);
        } else if (url.match(/\/staff\/\d+/) && method === 'get') {
          const id = parseInt(url.split('/staff/')[1]);
          mockResult = mockBackend.getStaffById(id);
        } else if (url.match(/\/staff\/\d+/) && method === 'put') {
          const id = parseInt(url.split('/staff/')[1]);
          mockResult = mockBackend.updateStaff(id, reqData);
        } else if (url.match(/\/staff\/\d+/) && method === 'delete') {
          const id = parseInt(url.split('/staff/')[1]);
          mockResult = mockBackend.deleteStaff(id);
        } else if (url.includes('/staff') && method === 'get') {
          mockResult = mockBackend.getStaff();
        } else if (url.includes('/staff') && method === 'post') {
          mockResult = mockBackend.createStaff(reqData);
        }

        // Equipment
        else if (url.includes('/equipment/available') && method === 'get') {
          mockResult = mockBackend.getAvailableEquipment();
        } else if (url.includes('/maintenance') && method === 'post') {
          const id = parseInt(url.split('/equipment/')[1]?.split('/')[0] || '1');
          mockResult = mockBackend.scheduleMaintenance(id, reqData);
        } else if (url.match(/\/equipment\/\d+/) && method === 'get') {
          const id = parseInt(url.split('/equipment/')[1]);
          mockResult = mockBackend.getEquipmentById(id);
        } else if (url.match(/\/equipment\/\d+/) && method === 'put') {
          const id = parseInt(url.split('/equipment/')[1]);
          mockResult = mockBackend.updateEquipment(id, reqData);
        } else if (url.includes('/equipment') && method === 'get') {
          mockResult = mockBackend.getEquipment();
        } else if (url.includes('/equipment') && method === 'post') {
          mockResult = mockBackend.createEquipment(reqData);
        }

        // Surgery Requests
        else if (url.includes('/status') && method === 'patch') {
          const id = parseInt(url.split('/surgery-requests/')[1]?.split('/')[0] || '1');
          mockResult = mockBackend.updateSurgeryStatus(id, (reqData as any).status);
        } else if (url.match(/\/surgery-requests\/\d+/) && method === 'delete') {
          const id = parseInt(url.split('/surgery-requests/')[1]);
          mockResult = mockBackend.cancelSurgery(id);
        } else if (url.match(/\/surgery-requests\/\d+/) && method === 'get') {
          const id = parseInt(url.split('/surgery-requests/')[1]);
          mockResult = mockBackend.getSurgeryById(id);
        } else if (url.includes('/surgery-requests') && method === 'get') {
          mockResult = mockBackend.getSurgeryRequests();
        } else if (url.includes('/surgery-requests') && method === 'post') {
          mockResult = mockBackend.createSurgeryRequest(reqData);
        }

        // Schedules & Validation
        else if (url.includes('/schedules/active') && method === 'get') {
          mockResult = mockBackend.getActiveSchedule();
        } else if (url.includes('/schedules/generate') && method === 'post') {
          mockResult = mockBackend.generateSchedule(reqData);
        } else if (url.includes('/validate') && method === 'post') {
          const id = parseInt(url.split('/schedules/')[1]?.split('/')[0] || '1');
          mockResult = mockBackend.validateSchedule(id);
        } else if (url.includes('/approve') && url.includes('/schedules') && method === 'post') {
          const id = parseInt(url.split('/schedules/')[1]?.split('/')[0] || '1');
          mockResult = mockBackend.approveSchedule(id);
        } else if (url.includes('/publish') && url.includes('/schedules') && method === 'post') {
          const id = parseInt(url.split('/schedules/')[1]?.split('/')[0] || '1');
          mockResult = mockBackend.publishSchedule(id);
        } else if (url.includes('/reject') && url.includes('/schedules') && method === 'post') {
          const id = parseInt(url.split('/schedules/')[1]?.split('/')[0] || '1');
          mockResult = mockBackend.rejectSchedule(id, (reqData as any)?.reason);
        } else if (url.match(/\/schedules\/\d+/) && method === 'get') {
          const id = parseInt(url.split('/schedules/')[1]);
          mockResult = mockBackend.getScheduleById(id);
        } else if (url.includes('/schedules') && method === 'get') {
          mockResult = mockBackend.getAllSchedules();
        }

        // Rescheduling & Disruptions
        else if (url.includes('/reschedule') && url.includes('/approve') && method === 'post') {
          const dId = parseInt(url.split('/reschedule/')[1]?.split('/')[0] || '1');
          mockResult = mockBackend.approveAlternative(dId, (reqData as any)?.alternativeId || 1);
        } else if (url.includes('/reschedule') && method === 'post') {
          mockResult = mockBackend.generateAlternatives(reqData);
        } else if (url.includes('/reschedule') && method === 'get') {
          mockResult = mockBackend.generateAlternatives({});
        } else if (url.includes('/disruptions') && method === 'post') {
          mockResult = mockBackend.registerDisruption(reqData);
        } else if (url.includes('/disruptions') && method === 'get') {
          mockResult = mockBackend.getDisruptions();
        }

        // Analytics
        else if (url.includes('/analytics/export') && method === 'get') {
          const csvContent = 'Room,Utilization,HoursScheduled,Turnaround\nOR-1,88.5%,9.2h,18m\nOR-2,82.0%,8.5h,24m\n';
          mockResult = new Blob([csvContent], { type: 'text/csv' });
        } else if (url.includes('/analytics') && method === 'get') {
          mockResult = mockBackend.getAnalytics();
        }

        // Audit Logs
        else if ((url.includes('/audit') || url.includes('/audit-logs')) && method === 'get') {
          mockResult = mockBackend.getAuditLogs();
        }

        // Notifications
        else if (url.includes('/notifications') && url.includes('/read') && method === 'patch') {
          const id = parseInt(url.split('/notifications/')[1]?.split('/')[0] || '1');
          mockResult = mockBackend.markNotificationRead(id);
        } else if (url.includes('/notifications') && method === 'get') {
          mockResult = mockBackend.getNotifications();
        }

        // Users
        else if (url.includes('/users') && method === 'get') {
          mockResult = mockBackend.getUsers();
        }

        if (mockResult !== null) {
          console.info('[Standalone Mode] Served local data for:', method.toUpperCase(), url);
          return Promise.resolve({
            data: mockResult,
            status: 200,
            statusText: 'OK',
            headers: {},
            config: error.config,
          });
        }
      } catch (mockErr: any) {
        return Promise.reject({
          response: {
            data: { message: mockErr.message || 'Operation failed in standalone mode' },
            status: 400,
          },
        });
      }
    }

    return Promise.reject(error);
  }
);

export default axiosClient;
