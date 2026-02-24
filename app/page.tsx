import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#faf9f7] relative overflow-hidden">
      {/* Fun decorative blobs */}
      <div className="absolute top-[-80px] left-[-60px] w-64 h-64 bg-purple-300/30 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-[-80px] right-[-60px] w-72 h-72 bg-pink-300/30 rounded-full blur-3xl animate-float" style={{ animationDelay: '1.5s' }} />
      <div className="absolute top-1/3 right-[-40px] w-40 h-40 bg-yellow-300/20 rounded-full blur-2xl animate-float" style={{ animationDelay: '0.8s' }} />

      <div className="text-center z-10">
        <div className="mb-4">
          <span className="text-6xl">👑</span>
        </div>
        <h1 className="font-display text-5xl font-extrabold gradient-text mb-3">
          King &amp; Queen
        </h1>
        <p className="text-lg text-gray-500 font-medium mb-10">
          Cast your vote for the royal pair ✨
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/vote"
            className="group px-10 py-4 rounded-2xl bg-gradient-to-r from-[#6c5ce7] to-[#a29bfe] text-white font-bold text-lg transition-all duration-300 hover:shadow-lg hover:shadow-purple-300/40 hover:scale-105 active:scale-95"
          >
            🗳️ Vote Now
          </Link>
          <Link
            href="/admin-login"
            className="px-10 py-4 rounded-2xl border-2 border-purple-200 text-[#6c5ce7] hover:bg-purple-50 font-bold text-lg transition-all duration-300 hover:scale-105 active:scale-95"
          >
            ⚙️ Admin
          </Link>
        </div>
      </div>

      <footer className="fixed bottom-0 left-0 w-full py-3 text-center bg-[#faf9f7]/80 backdrop-blur-sm">
        <p className="text-[#6c5ce7]/50 text-sm font-medium">Supported by UX Team</p>
      </footer>
    </main>
  );
}
