import type { SyntheticEvent } from 'react';

export const DEFAULT_GROUP_LOGO_URL = '/images/logo_minimal.svg';

export const resolveGroupLogoUrl = (logoUrl?: string | null) => {
  const normalizedLogoUrl = logoUrl?.trim();
  return normalizedLogoUrl || DEFAULT_GROUP_LOGO_URL;
};

export const handleGroupLogoError = (
  event: SyntheticEvent<HTMLImageElement>,
) => {
  const image = event.currentTarget;
  const fallbackUrl = new URL(DEFAULT_GROUP_LOGO_URL, window.location.origin).href;

  if (image.src !== fallbackUrl) {
    image.src = DEFAULT_GROUP_LOGO_URL;
  }
};
