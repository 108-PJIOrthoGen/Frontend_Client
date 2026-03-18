import { setRefreshTokenAction } from "@/redux/slice/accountSlice";
import { IBackendRes } from "@/types/backend";
import { notification } from "antd";
import { Mutex } from "async-mutex";
import axios from "axios";

interface AccessTokenResponse {
    access_token: string;
}
const NO_RETRY_HEADER = 'x-no-retry';
const mutex = new Mutex()
const instance = axios.create({
    baseURL: import.meta.env.VITE_BACKEND_URL as string,
    withCredentials: true
});

// sending bearer token with axios
const handleRefreshToken = async (): Promise<string | null> => {
    return await mutex.runExclusive(async () => {
        try {
            const res = await instance.get('/api/v1/auth/refresh') as unknown as IBackendRes<AccessTokenResponse>;
            if (res && res.data) return res.data.access_token;
            else return null;
        } catch (error) {
            console.log("ERROR IN REFRESH TOKEN:", error)
            throw error;
        }
    });
};
// Add a request interceptor
instance.interceptors.request.use(function (config) {
    if (typeof window !== "undefined" && window && window.localStorage && window.localStorage.getItem('access_token')) {
        config.headers.Authorization = 'Bearer ' + window.localStorage.getItem('access_token');
    }
    if (!config.headers.Accept && config.headers["Content-Type"]) {
        config.headers.Accept = "application/json";
        config.headers["Content-Type"] = "application/json; charset=utf-8";
    }
    return config;
});

// Add a response interceptor
instance.interceptors.response.use((res) => res.data,
    async (error) => {
        if (error.config && error.response
            && +error.response.status === 401
            && error.config.url !== '/api/v1/auth/login'
            && error.config.url !== '/api/v1/auth/refresh'
            && !error.config.headers[NO_RETRY_HEADER]
        ) {
            const access_token = await handleRefreshToken();
            error.config.headers[NO_RETRY_HEADER] = 'true'
            if (access_token) {
                error.config.headers['Authorization'] = `Bearer ${access_token}`;
                localStorage.setItem('access_token', access_token)
                return instance.request(error.config);
            }

        }

        // console.log("Check refresh token error:", {
        //     status: error?.response?.status,
        //     url: error?.config?.url,
        //     hasResponse: !!error.response,
        //     hasConfig: !!error.config
        // })

        if (
            error.response
            && +error.response.status === 401
            && error.config
            && error.config.url === '/api/v1/auth/refresh'
        ) {
            const message = error?.response?.data?.error ?? "Có lỗi xảy ra, vui lòng login.";
            console.log("REFRESH TOKEN ERROR:", message)
            //dispatch redux action
            dispatch(setRefreshTokenAction({ status: true, message }))
            console.log("điiđii")
        }

        // if (
        //     error.config && error.response
        //     && +error.response.status === 401
        //     && error.config.url === '/api/v1/auth/refresh'
        //     && location.pathname.startsWith("/admin")
        // ) {
        //     const message = error?.response?.data?.error ?? "Có lỗi xảy ra, vui lòng login.";
        //     //dispatch redux action
        //     dispatch(setRefreshTokenAction({ status: true, message: `${message}` }))
        // }


        if (+error.response.status === 403) {
            notification.error({
                message: error?.response?.data?.message ?? "",
                description: error?.response?.data?.error ?? ""
            })
        }

        return error?.response?.data ?? Promise.reject(error);
    });
export default instance

let dispatch: any;

export const injectStore = (_dispatch: any) => {
    dispatch = _dispatch;
};