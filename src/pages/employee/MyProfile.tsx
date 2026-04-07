import { useQuery } from '@tanstack/react-query';
import { ShieldCheck, Plus, Pencil, Sparkles, UserCircle2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';

export default function MyProfile() {
  const { user, profile } = useAuth();

  const { data: skills, isLoading } = useQuery({
    queryKey: ['employee-skills', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await supabase
        .from('employee_skills')
        .select('id, proficiency, self_rated, skills(name, category)')
        .eq('employee_id', user.id);
      return data || [];
    },
    enabled: !!user?.id,
  });

  const getLevelValue = (level: string) => {
    switch (level) {
      case 'expert':
        return 100;
      case 'advanced':
        return 75;
      case 'intermediate':
        return 50;
      case 'beginner':
        return 25;
      default:
        return 0;
    }
  };

  const radarData = skills && skills.length > 0
    ? skills.slice(0, 6).map((skill: any) => ({
        subject: skill.skills?.name || 'Unknown',
        level: getLevelValue(skill.proficiency),
      }))
    : [];

  const verifiedCount = (skills || []).filter((skill: any) => !skill.self_rated).length;
  const selfRatedCount = (skills || []).filter((skill: any) => skill.self_rated).length;
  const avgProficiency = radarData.length
    ? Math.round(radarData.reduce((sum, item) => sum + item.level, 0) / radarData.length)
    : 0;

  return (
    <div className="space-y-6">
      <section className="glass-panel overflow-hidden rounded-[32px] p-6 md:p-8">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#00d4aa]/55 to-transparent" />
        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#00d4aa]/20 bg-[#00d4aa]/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-[#00d4aa]">
              <Sparkles className="h-3.5 w-3.5" />
              Employee Identity
            </div>
            <div className="mt-6 flex flex-col gap-5 md:flex-row md:items-center">
              <div className="flex h-24 w-24 items-center justify-center rounded-[28px] border border-white/10 bg-white/5 text-[#00d4aa]">
                <UserCircle2 className="h-14 w-14" />
              </div>
              <div>
                <h2 className="text-3xl font-black tracking-[-0.03em]">{profile?.full_name || 'Employee Profile'}</h2>
                <p className="mt-2 text-sm text-white/60">
                  {profile?.job_title || 'Growth-focused contributor'} · {profile?.department || 'Engineering'} · Joined 2026
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded-full border border-[#00d4aa]/25 bg-[#00d4aa]/10 px-3 py-1.5 text-xs font-semibold text-[#00d4aa]">
                    Verified skills: {verifiedCount}
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/75">
                    Self-rated skills: {selfRatedCount}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
            <ProfileMetric label="Skill Signals" value={`${skills?.length || 0}`} detail="Capabilities tracked" />
            <ProfileMetric label="Average Strength" value={`${avgProficiency}%`} detail="Current competency baseline" />
            <ProfileMetric label="Readiness" value={avgProficiency >= 70 ? 'High' : avgProficiency >= 45 ? 'Building' : 'Early'} detail="Current role fit confidence" />
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1fr_1.1fr]">
        <section className="glass-panel card-float rounded-[30px] p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.24em] text-[#00d4aa]">Competency Radar</div>
              <h3 className="mt-2 text-2xl font-bold">Verified vs. self-view</h3>
            </div>
            <button className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/80 transition hover:bg-white/10">
              <Plus className="h-4 w-4" />
              Add Skill
            </button>
          </div>
          <div className="h-[400px]">
            {radarData.length > 0 ? (
              <AnimatedRadar data={radarData} />
            ) : (
              <div className="flex h-full items-center justify-center rounded-[24px] border border-dashed border-white/10 bg-white/5 text-sm text-white/45">
                No skills yet.
              </div>
            )}
          </div>
        </section>

        <section className="glass-panel card-float overflow-hidden rounded-[30px]">
          <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.24em] text-[#f0a500]">Skills Matrix</div>
              <h3 className="mt-2 text-2xl font-bold">Verified Skills Ledger</h3>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/[0.03] text-white/55">
                <tr>
                  <th className="px-6 py-4 font-medium">Skill</th>
                  <th className="px-6 py-4 font-medium">Domain</th>
                  <th className="px-6 py-4 font-medium">Level</th>
                  <th className="px-6 py-4 text-right font-medium">Validation</th>
                </tr>
              </thead>
              <tbody>
                {(skills || []).map((skill: any) => (
                  <tr key={skill.id} className="border-t border-white/6 transition hover:bg-white/[0.03]">
                    <td className="px-6 py-4 font-semibold text-white">{skill.skills?.name}</td>
                    <td className="px-6 py-4 text-white/55">{skill.skills?.category}</td>
                    <td className="px-6 py-4">
                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white/75">
                        {skill.proficiency}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {skill.self_rated ? (
                          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-white/55">
                            Self Rated
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full border border-[#00d4aa]/20 bg-[#00d4aa]/10 px-3 py-1 text-xs font-semibold text-[#00d4aa]">
                            <ShieldCheck className="h-3.5 w-3.5" />
                            Verified
                          </span>
                        )}
                        <button className="rounded-full border border-white/10 bg-white/5 p-2 text-white/45 transition hover:bg-white/10 hover:text-white">
                          <Pencil className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {isLoading && (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-center text-white/45">
                      Loading profile skills...
                    </td>
                  </tr>
                )}
                {!isLoading && (!skills || skills.length === 0) && (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-center text-white/45">
                      No skills recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

function ProfileMetric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
      <div className="text-xs font-semibold uppercase tracking-[0.22em] text-white/45">{label}</div>
      <div className="mt-2 text-3xl font-black">{value}</div>
      <div className="mt-2 text-sm text-white/52">{detail}</div>
    </div>
  );
}

function AnimatedRadar({ data }: { data: Array<{ subject: string; level: number }> }) {
  const size = 360;
  const center = size / 2;
  const radius = 120;

  const points = data.map((item, index) => {
    const angle = (Math.PI * 2 * index) / data.length - Math.PI / 2;
    const x = center + Math.cos(angle) * radius * (item.level / 100);
    const y = center + Math.sin(angle) * radius * (item.level / 100);
    const labelX = center + Math.cos(angle) * (radius + 38);
    const labelY = center + Math.sin(angle) * (radius + 38);
    return { ...item, angle, x, y, labelX, labelY };
  });

  const polygonPoints = points.map((point) => `${point.x},${point.y}`).join(' ');

  return (
    <div className="flex h-full items-center justify-center">
      <svg viewBox={`0 0 ${size} ${size}`} className="max-h-full w-full">
        {[1, 0.75, 0.5, 0.25].map((scale) => (
          <polygon
            key={scale}
            points={data
              .map((_, index) => {
                const angle = (Math.PI * 2 * index) / data.length - Math.PI / 2;
                const x = center + Math.cos(angle) * radius * scale;
                const y = center + Math.sin(angle) * radius * scale;
                return `${x},${y}`;
              })
              .join(' ')}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
          />
        ))}

        {points.map((point) => (
          <g key={point.subject}>
            <line x1={center} y1={center} x2={point.labelX - 12 * Math.cos(point.angle)} y2={point.labelY - 12 * Math.sin(point.angle)} stroke="rgba(255,255,255,0.08)" />
            <text x={point.labelX} y={point.labelY} textAnchor="middle" dominantBaseline="middle" fill="rgba(255,255,255,0.62)" fontSize="12">
              {point.subject}
            </text>
          </g>
        ))}

        <polygon points={polygonPoints} fill="rgba(0,212,170,0.16)" stroke="rgba(0,212,170,0.95)" strokeWidth="3" className="radar-draw" />
        {points.map((point) => (
          <circle key={`${point.subject}-node`} cx={point.x} cy={point.y} r="5" fill="#0d0e14" stroke="#00d4aa" strokeWidth="3" />
        ))}
      </svg>
    </div>
  );
}
