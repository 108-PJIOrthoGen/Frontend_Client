export const importanceColor = (imp?: string) => {
    if (imp === 'CRITICAL') return 'red';
    if (imp === 'HIGH') return 'orange';
    return 'blue';
};

export const importanceLabel = (imp?: string) => {
    if (imp === 'CRITICAL') return 'Rất quan trọng';
    if (imp === 'HIGH') return 'Quan trọng';
    return 'Trung bình';
};

export const categoryIcon = (cat?: string) => {
    if (cat === 'ICM_MAJOR') return 'emergency';
    if (cat === 'ICM_MINOR') return 'science';
    return 'medical_information';
};

export const categoryLabel = (cat?: string) => {
    if (cat === 'ICM_MAJOR') return 'ICM Major';
    if (cat === 'ICM_MINOR') return 'ICM Minor';
    return 'Lâm sàng';
};