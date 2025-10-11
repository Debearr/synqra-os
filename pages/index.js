export default function Home() {
  return (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#000',
        color: '#fff',
        fontFamily: 'Inter, sans-serif',
      }}
    >
      <h1 style={{ fontSize: '3rem', fontWeight: '700', color: '#0ff' }}>
        Synqra
      </h1>
      <p style={{ fontSize: '1.2rem' }}>
        Automating content creation for the luxury world ⚡
      </p>
    </div>
  );
}
