import Navbar from "@/components/Navbar";
import ChatInterface from "@/components/ChatInterface";

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="flex-1 bg-background">
        <ChatInterface />
      </main>
    </>
  );
}
