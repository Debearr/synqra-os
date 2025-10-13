import dynamic from "next/dynamic";

const ControlTower = dynamic(() => import("../components/ControlTower"), { ssr: false });

export default function Home() {
  return (
    <main className="bg-black text-white min-h-screen">
      <ControlTower />
    </main>
  );
}
