import queryString from 'query-string';

type SortOrder = 'ascend' | 'descend' | null | undefined;

interface TableRequestParams {
    current?: number;
    pageSize?: number;
}

interface BuildTableQueryOptions {
    params: TableRequestParams;
    sort?: Record<string, SortOrder>;
    filter?: string;
    sortableFields: readonly string[];
    defaultSortField?: string;
}

export const buildTableQuery = ({
    params,
    sort = {},
    filter,
    sortableFields,
    defaultSortField = 'updatedAt',
}: BuildTableQueryOptions): string => {
    const query = queryString.stringify({
        page: (params.current ?? 1) - 1,
        size: params.pageSize,
        ...(filter ? { filter } : {}),
    });

    const activeSortField = sortableFields.find((field) => sort[field]);
    const sortField = activeSortField ?? defaultSortField;
    const sortDirection =
        activeSortField && sort[activeSortField] === 'ascend' ? 'asc' : 'desc';

    return `${query}&sort=${sortField},${sortDirection}`;
};
