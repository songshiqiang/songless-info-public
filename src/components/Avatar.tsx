/** A player's avatar: their chosen emoji, or the first letter of their name. */
export default function Avatar({ name, avatar, size = 36 }: { name: string; avatar: string; size?: number }) {
  return (
    <span
      className={avatar ? 'avatar' : 'avatar avatar-letter'}
      style={{ width: size, height: size, fontSize: avatar ? size * 0.55 : size * 0.42 }}
      aria-hidden="true"
    >
      {avatar || Array.from(name.trim())[0]?.toUpperCase() || '?'}
    </span>
  );
}
