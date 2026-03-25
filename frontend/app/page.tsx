import GridTemplate from "@/components/GridTemplate";
import Image from "next/image";

export default function Home() {
  return (
    <div className="flex min-h-screen w-screen w-[100vw] items-center justify-center bg-zinc-50 font-sans dark:bg-black">
        <GridTemplate/>
    </div>
  );
}
