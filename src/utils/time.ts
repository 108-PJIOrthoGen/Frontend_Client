import dayjs from "dayjs";

export const parseDateFromApi = (dateValue: any): string => {
    if (!dateValue) return '';

    const dateStr = String(dateValue).trim();
    // If it matches ISO format (YYYY-MM-DD), convert to DD/MM/YYYY
    if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
        const parsed = dayjs(dateStr, 'YYYY-MM-DD');
        if (parsed.isValid()) {
            return parsed.format('DD/MM/YYYY');
        }
    }

    // If it's already in DD/MM/YYYY format, check if valid
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
        const parsed = dayjs(dateStr, 'DD/MM/YYYY');
        if (parsed.isValid()) {
            return dateStr;
        }
    }

    // Try to parse as ISO format first
    let date = dayjs(dateStr, 'YYYY-MM-DD');
    if (date.isValid()) {
        return date.format('DD/MM/YYYY');
    }

    // Try DD/MM/YYYY format
    date = dayjs(dateStr, 'DD/MM/YYYY');
    if (date.isValid()) {
        return dateStr;
    }

    // If nothing works, return empty
    return '';
};