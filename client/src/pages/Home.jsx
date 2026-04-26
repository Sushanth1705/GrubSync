import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import api from '../api';
import restaurants from '../data/restaurants';

const Home = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [restaurantName, setRestaurantName] = useState(restaurants[0].name);
  const [customRestaurant, setCustomRestaurant] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [loading, setLoading] = useState(false);

  const selectedRestaurant = useMemo(() => {
    return restaurantName === 'Other' ? customRestaurant.trim() : restaurantName;
  }, [restaurantName, customRestaurant]);

  const ensureAuth = () => {
    if (!user) {
      showToast('Login to continue', 'error');
      navigate('/auth');
      return false;
    }
    return true;
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    if (!ensureAuth()) return;
    if (!selectedRestaurant) {
      showToast('Please choose a restaurant name', 'error');
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post('/rounds', { restaurantName: selectedRestaurant });
      showToast('Round created successfully');
      navigate(`/round/${data.roomCode}`);
    } catch (error) {
      showToast(error?.response?.data?.message || 'Could not create round', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (event) => {
    event.preventDefault();
    if (!ensureAuth()) return;
    if (!roomCode.trim()) {
      showToast('Enter a room code', 'error');
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post(`/rounds/${roomCode.trim().toUpperCase()}/join`);
      showToast('Joined round');
      navigate(`/round/${data.roomCode}`);
    } catch (error) {
      showToast(error?.response?.data?.message || 'Could not join round', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl rounded-[32px] bg-slate-900/95 p-6 shadow-[0_30px_80px_rgba(15,23,42,0.7)] sm:p-10 ring-1 ring-slate-800">
      <h1 className="text-3xl font-semibold text-slate-100">Welcome to GrubSync</h1>
      <p className="mt-3 text-slate-400">Create a round, share the code, add items, and split the bill in real time.</p>

      <section className="mt-8 rounded-3xl bg-slate-800/80 p-6 ring-1 ring-slate-700">
        <h2 className="text-xl font-semibold text-orange">Create a Round</h2>
        <form onSubmit={handleCreate} className="mt-4 space-y-4">
          <label className="block text-sm font-medium text-slate-700">Restaurant name</label>
          <select value={restaurantName} onChange={(e) => setRestaurantName(e.target.value)} className="w-full bg-white text-slate-900">
            {restaurants.map((restaurant) => (
              <option key={restaurant.name} value={restaurant.name}>{restaurant.name}</option>
            ))}
            <option value="Other">Other</option>
          </select>
          {restaurantName === 'Other' && (
            <input value={customRestaurant} onChange={(e) => setCustomRestaurant(e.target.value)} placeholder="Enter custom restaurant name" className="w-full" />
          )}
          <button type="submit" className="w-full rounded-2xl bg-orange py-3 text-white disabled:cursor-not-allowed disabled:opacity-70" disabled={!selectedRestaurant || loading}>
            {loading ? 'Creating…' : 'Create Round'}
          </button>
        </form>
      </section>

      <section className="mt-8 rounded-3xl border border-slate-800 p-6 bg-slate-900/90">
        <h2 className="text-xl font-semibold text-slate-100">Join with Room Code</h2>
        <form onSubmit={handleJoin} className="mt-4 space-y-4">
          <input value={roomCode} onChange={(e) => setRoomCode(e.target.value)} placeholder="6-character code" className="w-full uppercase tracking-[0.3em]" />
          <button type="submit" className="w-full rounded-2xl bg-slate-900 py-3 text-white disabled:cursor-not-allowed disabled:opacity-70" disabled={!roomCode.trim() || loading}>
            {loading ? 'Joining…' : 'Join Round'}
          </button>
        </form>
      </section>
    </div>
  );
};

export default Home;
