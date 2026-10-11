import React, { useEffect, useState } from 'react';

interface StoreAvatarProps {
  /** Store name, also used to build the initials fallback. */
  name: string;
  /** Preferred source: the store's own uploaded logo. */
  logoUrl?: string;
  /** Used only when the store has no logo, e.g. its offer photo. */
  fallbackImageUrl?: string;
  /** Classes for the rendered `<img>` / initials element. */
  className?: string;
  /** Extra classes applied to the initials element (layout, colours). */
  initialsClassName?: string;
  alt?: string;
}

/**
 * Store avatar with a graceful image chain: logo -> offer photo -> initials.
 *
 * Remote logos can 403 or time out, so every candidate is allowed to fail
 * before we settle on the initials badge, instead of showing a broken image.
 */
export const StoreAvatar: React.FC<StoreAvatarProps> = ({
  name, logoUrl, fallbackImageUrl, className = '', initialsClassName = '', alt,
}) => {
  const candidates = [logoUrl, fallbackImageUrl].filter((url): url is string => Boolean(url));
  const [candidateIndex, setCandidateIndex] = useState(0);

  // A new store (or a refreshed logo) must restart from the best source.
  useEffect(() => { setCandidateIndex(0); }, [logoUrl, fallbackImageUrl]);

  const src = candidates[candidateIndex];

  if (src) {
    return (
      <img
        src={src}
        alt={alt ?? name}
        className={className}
        onError={() => setCandidateIndex((current) => current + 1)}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className={`${className} flex items-center justify-center ${initialsClassName}`.trim()}
    >
      {name.trim().charAt(0) || 'م'}
    </span>
  );
};