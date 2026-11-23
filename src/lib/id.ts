export const createId = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
export const slugify = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
