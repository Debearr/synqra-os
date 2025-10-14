export default function Home() {
  const url = process.env.NEXT_PUBLIC_HOMEPAGE_URL || "https://synqra.co";
  return (
    <div style={{
      minHeight:'100vh',
      display:'flex',
      flexDirection:'column',
      alignItems:'center',
      justifyContent:'center',
      backgroundColor:'#000',
      color:'#fff',
      fontFamily:'Inter, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica Neue, Arial, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"'
    }}>
      <h1 style={{fontSize:'3rem', fontWeight:800, color:'#00FFFF', margin:0}}>Synqra</h1>
      <p style={{fontSize:'1.2rem', opacity:0.9, marginTop:8}}>Automating content creation for the luxury world ⚡</p>
      <a href={url} target="_blank" rel="noreferrer" style={{
        marginTop:16,
        color:'#00FFFF',
        textDecoration:'none',
        border:'1px solid #00FFFF',
        padding:'8px 14px',
        borderRadius:8
      }}>Visit Homepage</a>
    </div>
  );
}
