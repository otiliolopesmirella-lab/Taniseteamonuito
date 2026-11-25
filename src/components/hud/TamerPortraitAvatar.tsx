import { useEffect, useState } from 'react';
import type { TamerId } from '../../types/character';
import { isValidCoverPhotoDataUrl } from '../../utils/avatarPhoto';

interface TamerPortraitAvatarProps {
  tamerId: TamerId;
  tamerName: string;
  sizeClass?: string;
  customPhotoUrl?: string | null;
}

/**
 * Renders the player's custom uploaded Tamer photo when set, or falls back cleanly
 * to the authentic first-frame head & upper-body portrait from `/assets/sprites/tamers/<id>/idle.png`.
 */
export function TamerPortraitAvatar({
  tamerId,
  tamerName,
  sizeClass = 'h-12 w-12',
  customPhotoUrl = null,
}: TamerPortraitAvatarProps) {
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    setImgFailed(false);
  }, [customPhotoUrl]);

  const validCustomUrl =
    !imgFailed && isValidCoverPhotoDataUrl(customPhotoUrl)
      ? customPhotoUrl
      : null;

  return (
    <div
      className={`relative overflow-hidden rounded-full bg-gradient-to-b from-[#0b2f78] to-[#04102b] ${sizeClass}`}
    >
      {validCustomUrl ? (
        <img
          src={validCustomUrl}
          alt={`Foto de ${tamerName}`}
          decoding="async"
          onError={() => setImgFailed(true)}
          className="h-full w-full object-cover object-center"
        />
      ) : (
        <div
          role="img"
          aria-label={`Retrato de ${tamerName}`}
          className="h-full w-full"
          style={{
            backgroundImage: `url(/assets/sprites/tamers/${tamerId}/idle.png?v=hd3)`,
            backgroundRepeat: 'no-repeat',
            backgroundSize: '420% auto',
            backgroundPosition: '2.5% 10%',
            imageRendering: 'auto',
          }}
        />
      )}
    </div>
  );
}
