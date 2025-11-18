const ACCESS_KEY = 'florte:access_token';
const REFRESH_KEY = 'florte:refresh_token';
const USER_KEY = 'florte:user';
export const storage = {
    getAccessToken() {
        return localStorage.getItem(ACCESS_KEY);
    },
    getRefreshToken() {
        return localStorage.getItem(REFRESH_KEY);
    },
    getUser() {
        const raw = localStorage.getItem(USER_KEY);
        return raw ? JSON.parse(raw) : null;
    },
    setSession(accessToken, refreshToken) {
        localStorage.setItem(ACCESS_KEY, accessToken);
        localStorage.setItem(REFRESH_KEY, refreshToken);
    },
    setUser(user) {
        localStorage.setItem(USER_KEY, JSON.stringify(user));
    },
    clear() {
        localStorage.removeItem(ACCESS_KEY);
        localStorage.removeItem(REFRESH_KEY);
        localStorage.removeItem(USER_KEY);
    }
};
