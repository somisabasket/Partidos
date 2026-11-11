export const getAssetUrl = (relativePath: string): string => {
  const base = import.meta.env.BASE_URL || '/';
  const cleanBase = base.endsWith('/') ? base : `${base}/`;
  const cleanPath = relativePath.startsWith('/') ? relativePath.slice(1) : relativePath;
  return `${cleanBase}${cleanPath}`;
};

export const SOMISA_CREST_URL = getAssetUrl('assets/aistudio/SOMI_SIN_FONDO_9a531ff6.png');
export const SAMPLE_SHEET_IMG_URL = getAssetUrl('assets/aistudio/WhatsApp_Image_2026-11-10_at_17.33.00_b26e2a22.jpeg');
