export const homePathForRole = (roleName?: string): string => (
  roleName?.toUpperCase() === 'PHARMACIST' ? '/antibiotic-planner' : '/'
);
