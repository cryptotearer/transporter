import Image from "next/image";
import MapLayout from "../components/mapLayout";
export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <MapLayout />
    </main>
  );
}
