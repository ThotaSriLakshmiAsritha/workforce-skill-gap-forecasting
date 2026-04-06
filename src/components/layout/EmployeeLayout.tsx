import { Outlet, Link } from 'react-router-dom';

export const EmployeeLayout = () => {
  return (
    <div className="flex min-h-screen bg-secondary/20">
      <aside className="w-64 bg-background border-r flex flex-col">
        <div className="h-16 flex items-center px-4 border-b">
          <h1 className="font-bold text-lg text-primary">Employee Portal</h1>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <Link to="/employee" className="block px-4 py-2 rounded hover:bg-secondary">My Profile</Link>
          <Link to="/employee/learning" className="block px-4 py-2 rounded hover:bg-secondary">Learning Path</Link>
          <Link to="/employee/projects" className="block px-4 py-2 rounded hover:bg-secondary">My Projects</Link>
          <Link to="/employee/gap-goal" className="block px-4 py-2 rounded hover:bg-secondary">Skill Gap to Goal</Link>
        </nav>
      </aside>
      <main className="flex-1 p-8">
        <Outlet />
      </main>
    </div>
  );
};
