export default function EnvironmentLayer() {
  return (
    <div
      className="fixed inset-0 pointer-events-none"
      style={{
        backgroundImage: 'url(/noise.png)',
        backgroundSize: '512px 512px',
        opacity: 0.025,
        mixBlendMode: 'overlay',
        zIndex: -1,
      }}
    />
  );
}
