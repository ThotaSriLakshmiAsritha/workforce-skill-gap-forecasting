import { Outlet, Link } from 'react-router-dom';

export const OrgLayout = () => {
  return (
    <div className="flex min-h-screen bg-secondary/20">
      <aside className="w-64 bg-background border-r flex flex-col">
        <div className="h-16 flex items-center px-4 border-b">
          <h1 className="font-bold text-lg text-primary">HR/Org Portal</h1>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <Link to="/org" className="block px-4 py-2 rounded hover:bg-secondary">Dashboard</Link>
          <Link to="/org/allocator" className="block px-4 py-2 rounded hover:bg-secondary">Project Allocator</Link>
          <Link to="/org/screener" className="block px-4 py-2 rounded hover:bg-secondary">Resume Screener</Link>
        </nav>
      </aside>
      <main className="flex-1 p-8">
        <Outlet />
      </main>
    </div>
  );
};
