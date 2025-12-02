export default function Sidebar() {
  return (
    <aside className="hidden md:block w-60 border-r bg-[var(--muted)] min-h-screen p-4">
      <nav className="space-y-2 text-sm">
        <a className="block px-2 py-1 rounded hover:bg-white/50" href="#">Overview</a>
        <a className="block px-2 py-1 rounded hover:bg-white/50" href="#">Events</a>
        <a className="block px-2 py-1 rounded hover:bg-white/50" href="#">Patrols</a>
        <a className="block px-2 py-1 rounded hover:bg-white/50" href="#">Readiness</a>
      </nav>
    </aside>
  );
}
