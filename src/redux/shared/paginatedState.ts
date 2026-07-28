import type { IModelPaginate } from '@/types/backend';

export interface PaginatedListState<T> {
    isFetching: boolean;
    error: string | null;
    meta: IModelPaginate<T>['meta'];
    result: T[];
}

export const createPaginatedListState = <T>(
    initialPage: number,
): PaginatedListState<T> => ({
    isFetching: true,
    error: null,
    meta: {
        page: initialPage,
        pageSize: 10,
        pages: 0,
        total: 0,
    },
    result: [],
});

export const requirePaginatedData = <T>(
    data: IModelPaginate<T> | undefined,
    resourceName: string,
): IModelPaginate<T> => {
    if (!data) {
        throw new Error(`Missing ${resourceName} pagination data`);
    }

    return data;
};
