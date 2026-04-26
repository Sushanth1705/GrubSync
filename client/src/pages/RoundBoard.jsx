import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import api from '../api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import restaurants from '../data/restaurants';

const RoundBoard = () => {
  const { roomCode } = useParams();
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [round, setRound] = useState(null);
  const [items, setItems] = useState([]);
  const [payments, setPayments] = useState([]);
  const [billInfo, setBillInfo] = useState({ finalBillTotal: 0, deliveryFee: 0, taxes: 0 });
  const [status, setStatus] = useState('open');
  const [newItem, setNewItem] = useState({ itemName: '', quantity: 1, price: 0 });
  const [billForm, setBillForm] = useState({ finalBillTotal: '', deliveryFee: '', taxes: '' });
  const [socket, setSocket] = useState(null);
  const [loading, setLoading] = useState(false);

  const socketUrl = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:5000';

  const currentUserId = user?._id;
  const roundId = round?._id;

  const restaurantMenu = useMemo(() => {
    if (!round?.restaurantName) return [];
    return restaurants.find((restaurant) => restaurant.name === round.restaurantName)?.items || [];
  }, [round]);

  const handleAddSuggestedItem = (item) => {
    setNewItem({ itemName: item.name, quantity: 1, price: item.price });
    showToast(`Selected ${item.name} from ${round.restaurantName || 'menu'}`);
  };

  const groupedItems = useMemo(() => {
    return items.reduce((acc, item) => {
      const owner = item.userId?.name || 'You';
      const id = item.userId?._id || item.userId;
      if (!acc[id]) {
        acc[id] = { owner, items: [] };
      }
      acc[id].items.push(item);
      return acc;
    }, {});
  }, [items]);

  const fetchRound = async () => {
    try {
      const { data } = await api.get(`/rounds/${roomCode}`);
      setRound(data);
      setStatus(data.status);
    } catch (error) {
      showToast('Unable to load round details', 'error');
      navigate('/');
    }
  };

  const fetchItems = async () => {
    if (!roundId) return;
    try {
      const { data } = await api.get(`/orders/${roundId}`);
      setItems(data);
    } catch (error) {
      showToast('Unable to load order items', 'error');
    }
  };

  const fetchBill = async () => {
    if (!roundId) return;
    try {
      const { data } = await api.get(`/bill/${roundId}`);
      setBillInfo(data.roundInfo || { finalBillTotal: 0, deliveryFee: 0, taxes: 0 });
      setPayments(data.payments || []);
    } catch (error) {
      showToast('Unable to load bill info', 'error');
    }
  };

  useEffect(() => {
    fetchRound();
  }, [roomCode]);

  useEffect(() => {
    if (roundId) {
      fetchItems();
      fetchBill();
    }
  }, [roundId]);

  useEffect(() => {
    const socketClient = io(socketUrl);
    setSocket(socketClient);

    socketClient.on('connect', () => {
      if (roomCode && currentUserId) {
        socketClient.emit('join-room', { roomCode, userId: currentUserId });
      }
    });

    socketClient.on('order-updated', () => {
      fetchItems();
      fetchBill();
    });

    socketClient.on('status-changed', ({ status: newStatus }) => {
      setStatus(newStatus);
      showToast(`Round status updated to ${newStatus}`);
    });

    socketClient.on('payment-updated', () => {
      fetchBill();
    });

    return () => {
      socketClient.disconnect();
    };
  }, [roomCode, currentUserId]);

  const handleAddItem = async (event) => {
    event.preventDefault();
    if (!newItem.itemName.trim()) {
      showToast('Enter a valid item name', 'error');
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post(`/orders/${roundId}`, newItem);
      setItems((existing) => [...existing, data]);
      setNewItem({ itemName: '', quantity: 1, price: 0 });
      socket?.emit('add-item', { roomCode, item: data });
      fetchBill();
      showToast('Item added');
    } catch (error) {
      showToast(error?.response?.data?.message || 'Could not add item', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (itemId) => {
    setLoading(true);
    try {
      await api.delete(`/orders/${itemId}`);
      setItems((prev) => prev.filter((item) => item._id !== itemId));
      socket?.emit('remove-item', { roomCode, itemId });
      fetchBill();
      showToast('Item removed');
    } catch (error) {
      showToast(error?.response?.data?.message || 'Could not remove item', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (!round) return;
    try {
      const { data } = await api.patch(`/rounds/${roomCode}/status`, { status: newStatus });
      setStatus(data.status);
      socket?.emit('update-status', { roomCode, status: data.status });
      showToast('Status updated');
    } catch (error) {
      showToast(error?.response?.data?.message || 'Could not update status', 'error');
    }
  };

  const handleBillUpdate = async (event) => {
    event.preventDefault();
    try {
      const payload = {
        finalBillTotal: Number(billForm.finalBillTotal) || 0,
        deliveryFee: Number(billForm.deliveryFee) || 0,
        taxes: Number(billForm.taxes) || 0,
      };
      const { data } = await api.patch(`/rounds/${roomCode}/bill`, payload);
      setRound(data);
      setBillInfo(payload);
      fetchBill();
      showToast('Bill updated');
    } catch (error) {
      showToast(error?.response?.data?.message || 'Could not update bill', 'error');
    }
  };

  const handleMarkPaid = async () => {
    try {
      const { data } = await api.patch(`/bill/${roundId}/pay`);
      setPayments((prev) => prev.map((payment) => payment._id === data._id ? data : payment));
      socket?.emit('mark-paid', { roomCode, paymentInfo: data });
      showToast('Marked as paid');
    } catch (error) {
      showToast(error?.response?.data?.message || 'Could not mark as paid', 'error');
    }
  };

  const handleConfirm = async (userId) => {
    try {
      const { data } = await api.patch(`/bill/${roundId}/confirm/${userId}`);
      setPayments((prev) => prev.map((payment) => payment._id === data._id ? data : payment));
      showToast('Payment confirmed');
    } catch (error) {
      showToast(error?.response?.data?.message || 'Could not confirm payment', 'error');
    }
  };

  if (!round) {
    return <div className="rounded-[32px] bg-white p-8 shadow-lg">Loading round...</div>;
  }

  const userPayment = payments.find((payment) => payment.userId?._id === currentUserId);
  const isHost = round.host?._id === currentUserId;
  const hostUpiLink = round.host?.upiId ? `upi://pay?pa=${encodeURIComponent(round.host.upiId)}&am=${userPayment?.amountOwed || 0}&tn=GrubSync` : null;

  return (
    <div className="space-y-6">
      <div className="rounded-[32px] bg-white p-6 shadow-lg">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-slate-500">Room code</p>
            <h1 className="text-3xl font-semibold text-slate-900">{round.restaurantName || 'New Round'}</h1>
            <p className="mt-2 text-sm text-slate-600">Code: {round.roomCode}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-orange/10 px-3 py-2 text-sm font-semibold text-orange">{status}</span>
            <span className="rounded-full border border-slate-200 px-3 py-2 text-sm text-slate-600">Host: {round.host?.name}</span>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
        <section className="rounded-[32px] bg-white p-6 shadow-lg">
          <h2 className="text-xl font-semibold text-slate-900">My Order</h2>
          <form onSubmit={handleAddItem} className="mt-5 space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <input value={newItem.itemName} onChange={(e) => setNewItem((cur) => ({ ...cur, itemName: e.target.value }))} placeholder="Item name" className="sm:col-span-2" />
              <input type="number" min="1" value={newItem.quantity} onChange={(e) => setNewItem((cur) => ({ ...cur, quantity: Number(e.target.value) }))} placeholder="Qty" />
              <input type="number" min="0" step="0.5" value={newItem.price} onChange={(e) => setNewItem((cur) => ({ ...cur, price: Number(e.target.value) }))} placeholder="Price" />
            </div>
            <button type="submit" disabled={loading} className="rounded-2xl bg-orange px-5 py-3 text-white hover:bg-orange/90">
              Add item
            </button>
          </form>

          {restaurantMenu.length > 0 && (
            <div className="mb-6 rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="mb-3 text-lg font-semibold text-slate-900">Popular menu from {round.restaurantName}</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {restaurantMenu.map((item) => (
                  <button key={item.name} type="button" onClick={() => handleAddSuggestedItem(item)} className="rounded-3xl border border-slate-200 bg-white p-4 text-left hover:border-orange hover:bg-orange/5">
                    <div className="flex items-center justify-between gap-4">
                      <span className="font-semibold text-slate-900">{item.name}</span>
                      <span className="text-sm text-slate-600">₹{item.price}</span>
                    </div>
                    <p className="mt-2 text-sm text-slate-500">Tap to add</p>
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="mt-8 space-y-5">
            {Object.entries(groupedItems).map(([userId, group]) => (
              <div key={userId} className="rounded-3xl border border-slate-200 p-4">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-slate-900">{group.owner}</h3>
                    <p className="text-sm text-slate-500">{group.items.length} item(s)</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {group.items.map((item) => (
                    <div key={item._id} className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-slate-200 p-3">
                      <div>
                        <p className="font-medium text-slate-900">{item.itemName}</p>
                        <p className="text-sm text-slate-500">Qty {item.quantity} · ₹{item.price.toFixed(2)}</p>
                      </div>
                      {item.userId?._id === currentUserId && (
                        <button type="button" onClick={() => handleRemove(item._id)} className="rounded-full bg-slate-100 px-3 py-2 text-sm text-slate-700">
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[32px] bg-white p-6 shadow-lg">
          <h2 className="text-xl font-semibold text-slate-900">Bill Summary</h2>
          <div className="mt-4 space-y-4">
            <div className="rounded-3xl border border-slate-200 p-4">
              <p className="text-sm text-slate-500">Delivery fee</p>
              <p className="mt-1 text-lg font-semibold">₹{billInfo.deliveryFee?.toFixed(2) || '0.00'}</p>
            </div>
            <div className="rounded-3xl border border-slate-200 p-4">
              <p className="text-sm text-slate-500">Taxes</p>
              <p className="mt-1 text-lg font-semibold">₹{billInfo.taxes?.toFixed(2) || '0.00'}</p>
            </div>
            <div className="rounded-3xl border border-slate-200 p-4">
              <p className="text-sm text-slate-500">Your share</p>
              <p className="mt-1 text-2xl font-semibold text-slate-900">₹{userPayment?.amountOwed?.toFixed(2) || '0.00'}</p>
            </div>
            {hostUpiLink && currentUserId !== round.host?._id && (
              <a href={hostUpiLink} className="block rounded-2xl bg-orange px-4 py-3 text-center text-white hover:bg-orange/90">Pay with UPI</a>
            )}
            <button onClick={handleMarkPaid} disabled={userPayment?.status === 'paid' || !userPayment} className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-white hover:bg-slate-800 disabled:opacity-70">
              {userPayment?.status === 'paid' ? 'Paid' : 'Mark as Paid'}
            </button>
          </div>

          <div className="mt-8 rounded-3xl border border-slate-200 p-4">
            <h3 className="text-lg font-semibold text-slate-900">Payment statuses</h3>
            <div className="mt-4 space-y-3">
              {payments.map((payment) => (
                <div key={payment._id} className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 p-3">
                  <div>
                    <p className="font-medium text-slate-900">{payment.userId?.name || 'Member'}</p>
                    <p className="text-sm text-slate-500">₹{payment.amountOwed?.toFixed(2)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${payment.status === 'confirmed' ? 'bg-green-100 text-green-700' : payment.status === 'paid' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'}`}>
                      {payment.status}
                    </span>
                    {isHost && payment.userId?._id !== currentUserId && payment.status === 'paid' && (
                      <button onClick={() => handleConfirm(payment.userId?._id)} className="rounded-2xl bg-orange px-3 py-2 text-sm text-white hover:bg-orange/90">Confirm</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {isHost && (
            <div className="mt-8 rounded-3xl border border-slate-200 p-4">
              <h3 className="text-lg font-semibold text-slate-900">Host controls</h3>
              <div className="mt-4 space-y-4">
                <div className="grid gap-3 sm:grid-cols-3">
                  <button onClick={() => handleStatusChange('open')} className="rounded-2xl bg-slate-900 px-4 py-3 text-white hover:bg-slate-800">Open</button>
                  <button onClick={() => handleStatusChange('ordering')} className="rounded-2xl bg-orange px-4 py-3 text-white hover:bg-orange/90">Ordering</button>
                  <button onClick={() => handleStatusChange('ordered')} className="rounded-2xl bg-slate-700 px-4 py-3 text-white hover:bg-slate-600">Ordered</button>
                </div>
                <form onSubmit={handleBillUpdate} className="space-y-4">
                  <h4 className="text-sm font-semibold text-slate-900">Bill details</h4>
                  <input value={billForm.finalBillTotal} onChange={(e) => setBillForm((cur) => ({ ...cur, finalBillTotal: e.target.value }))} type="number" placeholder="Final bill total" />
                  <input value={billForm.deliveryFee} onChange={(e) => setBillForm((cur) => ({ ...cur, deliveryFee: e.target.value }))} type="number" placeholder="Delivery fee" />
                  <input value={billForm.taxes} onChange={(e) => setBillForm((cur) => ({ ...cur, taxes: e.target.value }))} type="number" placeholder="Taxes" />
                  <button className="w-full rounded-2xl bg-orange px-4 py-3 text-white hover:bg-orange/90">Update bill</button>
                </form>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default RoundBoard;
