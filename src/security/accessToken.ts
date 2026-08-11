let accessToken: string | null = null;

export const getAccessToken = (): string | null => accessToken;

export const setAccessToken = (token: string | null | undefined): void => {
  accessToken = token?.trim() || null;
};

export const clearAccessToken = (): void => {
  accessToken = null;
};
