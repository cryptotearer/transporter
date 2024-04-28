import Image from "next/image";
import MapLayout from "../components/mapLayout";
export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between md:py-5 md:px-20">
      <MapLayout />
    </main>
  );
}
