import { useEffect, useState } from 'react';
import api from '../api';
import { useToast } from '../contexts/ToastContext';

const Dashboard = () => {
  const [rounds, setRounds] = useState([]);
  const { showToast } = useToast();

  useEffect(() => {
    api.get('/rounds/history/me')
      .then(({ data }) => setRounds(data || []))
      .catch(() => showToast('Unable to load your history', 'error'));
  }, []);

  return (
    <div className="space-y-6">
      <div className="rounded-[32px] bg-slate-900/95 p-6 shadow-[0_30px_80px_rgba(15,23,42,0.6)] ring-1 ring-slate-800">
        <h1 className="text-2xl font-semibold text-slate-100">Dashboard</h1>
        <p className="mt-2 text-slate-400">Past rounds and current stats for your group orders.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-[32px] bg-slate-900/95 p-6 shadow-[0_30px_80px_rgba(15,23,42,0.6)] ring-1 ring-slate-800">
          <h2 className="text-xl font-semibold text-slate-100">Your rounds</h2>
          {rounds.length === 0 ? (
            <p className="mt-4 text-slate-600">No rounds yet. Create or join a round to start tracking orders.</p>
          ) : (
            <div className="mt-5 space-y-4">
              {rounds.map((round) => (
                <div key={round._id} className="rounded-3xl border border-slate-200 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">{round.restaurantName || 'Untitled Restaurant'}</h3>
                      <p className="text-sm text-slate-500">Code: {round.roomCode}</p>
                    </div>
                    <span className="rounded-full bg-orange/10 px-3 py-1 text-sm text-orange">{round.status}</span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 text-sm text-slate-500">
                    <span>Host: {round.host?.name || 'Unknown'}</span>
                    <span>Members: {round.members?.length || 0}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
