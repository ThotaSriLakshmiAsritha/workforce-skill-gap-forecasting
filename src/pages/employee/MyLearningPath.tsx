import { BookOpen, Clock, PlayCircle, CheckCircle2, AlertCircle } from 'lucide-react';

export default function MyLearningPath() {
  
  const courses = [
    { id: 1, title: 'Advanced React Patterns', platform: 'FrontendMasters', hours: 8, status: 'In Progress', priority: 'High', deadline: '2026-06-01' },
    { id: 2, title: 'AWS Cloud Practitioner Essentials', platform: 'AWS Training', hours: 6, status: 'Recommended', priority: 'Medium' },
    { id: 3, title: 'GraphQL with Node.js', platform: 'Udemy', hours: 12, status: 'Completed', priority: 'Low' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">My Learning Path</h2>
          <p className="text-muted-foreground mt-1">Personalized courses recommended for your upcoming projects and skill gaps.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {courses.map(course => (
          <div key={course.id} className="bg-card border rounded-lg overflow-hidden shadow-sm flex flex-col transform transition hover:-translate-y-1 hover:shadow-md">
            <div className={`h-2 ${
               course.status === 'Completed' ? 'bg-green-500' :
               course.status === 'In Progress' ? 'bg-primary' :
               'bg-amber-500'
            }`} />
            <div className="p-5 flex-1 flex flex-col">
              <div className="flex justify-between items-start mb-3">
                <span className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">{course.platform}</span>
                {course.priority === 'High' && <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded flex gap-1 items-center font-bold"><AlertCircle className="w-3 h-3"/> High Priority</span>}
              </div>
              <h3 className="font-bold text-lg mb-2 leading-tight">{course.title}</h3>
              
              <div className="flex items-center gap-3 text-sm text-muted-foreground mb-6">
                <div className="flex items-center gap-1"><Clock className="w-4 h-4"/> {course.hours} hrs</div>
                {course.deadline && <div className="flex items-center gap-1">Due {course.deadline}</div>}
              </div>

              <div className="mt-auto pt-4 border-t flex justify-between items-center">
                 <div className="text-sm font-medium">
                   {course.status === 'Recommended' && <span className="text-amber-600">Recommended</span>}
                   {course.status === 'In Progress' && <span className="text-primary flex items-center gap-1"><PlayCircle className="w-4 h-4"/> In Progress</span>}
                   {course.status === 'Completed' && <span className="text-green-600 flex items-center gap-1"><CheckCircle2 className="w-4 h-4"/> Completed</span>}
                 </div>
                 {course.status !== 'Completed' && (
                   <button className="bg-secondary text-secondary-foreground hover:bg-secondary/80 px-3 py-1.5 rounded-md text-sm font-medium transition flex items-center gap-1">
                     <BookOpen className="w-4 h-4"/> Open
                   </button>
                 )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
