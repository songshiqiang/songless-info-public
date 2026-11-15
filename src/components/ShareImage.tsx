import { useEffect, useState } from 'react';
import { HEIGHT, WIDTH, renderShareImage, type Card } from '../lib/share-image';
import { ui } from '../i18n/client';

interface Props {
  card: Card;
  fileName: string;
}

/** A result as a picture, ready to post. Drawn up front: phones only open the share sheet straight after a tap. */
export default function ShareImage({ card, fileName }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState('');
  const key = JSON.stringify(card);

  useEffect(() => {
    let live = true;
    let made = '';
    renderShareImage(card).then((blob) => {
      if (!live) return;
      made = URL.createObjectURL(blob);
      setUrl(made);
      setFile(new File([blob], fileName, { type: 'image/png' }));
    }).catch(() => {});
    return () => {
      live = false;
      if (made) URL.revokeObjectURL(made);
    };
  }, [key, fileName]); // eslint-disable-line react-hooks/exhaustive-deps

  const sheet = !!file && matchMedia('(pointer: coarse)').matches && !!navigator.canShare?.({ files: [file] });

  function saveImage() {
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
  }

  async function shareImage() {
    if (!sheet) return saveImage();
    try {
      await navigator.share({ files: [file!] });
    } catch (e) {
      if ((e as Error).name !== 'AbortError') saveImage();
    }
  }

  return (
    <div className="share-image">
      <div className="share-image-frame" style={{ aspectRatio: `${WIDTH} / ${HEIGHT}` }}>
        {url && <img src={url} width={WIDTH} height={HEIGHT} alt={[card.rank, card.hero, card.suffix].filter(Boolean).join(' ')} />}
      </div>
      <button className="btn btn-primary btn-block" onClick={shareImage} disabled={!file}>
        {sheet ? ui.shareImage.share : ui.shareImage.save}
      </button>
    </div>
  );
}
