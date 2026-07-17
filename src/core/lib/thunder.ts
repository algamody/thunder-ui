import type { AxiosError } from "axios";
import { ThunderSDK } from "thunder-sdk";
import { toast } from "sonner";

export const initThunder = () =>
    ThunderSDK.init({
        logs: true,
        axiosConfig: {
            baseURL: import.meta.env.VITE_API_BASE_URL ||
                window.location.origin,
            withCredentials: true,
        },
        cache: {
            getter: (key: string) => localStorage.getItem(key) || undefined,
            setter: (key: string, value: string) => {
                localStorage.setItem(key, value);
                return true;
            },
            delete: async (key: string) => {
                localStorage.removeItem(key);
                return true;
            },
            keys: () => Object.keys(localStorage),
        },
    });

export const cleanThunder = () => ThunderSDK.clean();

export const refreshThunder = async () => {
    await cleanThunder();
    await initThunder();

    ThunderSDK._axios?.interceptors.response.use(
        (_: any) => _,
        async (error: AxiosError<{ messages?: { message: string }[] }>) => {
            if (error.response?.data?.messages?.length) {
                error.response.data.messages.map((v: { message: string }) =>
                    toast.error(v.message)
                );
            } else if (error?.message !== "canceled") {
                toast.error(error.message);
            }
            
            return Promise.reject(error);
        },
    );
};
