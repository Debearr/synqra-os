// Convert this page route into a simple redirect to the API route
export default function InviteQrRedirect() {
  return null;
}

export async function getServerSideProps(ctx) {
  const token = ctx.params.token;
  return {
    redirect: {
      destination: `/api/invite/qr/${encodeURIComponent(token)}`,
      permanent: false
    }
  };
}
