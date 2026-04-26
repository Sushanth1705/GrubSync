const calculateSplit = (members, orders, finalTotal, deliveryFee, taxes) => {
  // Group orders by userId and calculate subtotals
  const userSubtotals = {};
  let totalItemsCost = 0;

  orders.forEach(order => {
    const userId = order.userId.toString();
    const itemTotal = order.price * order.quantity;
    
    if (!userSubtotals[userId]) {
      userSubtotals[userId] = 0;
    }
    userSubtotals[userId] += itemTotal;
    totalItemsCost += itemTotal;
  });

  const fees = Number(deliveryFee || 0) + Number(taxes || 0);
  const totalWithoutAdjustment = totalItemsCost + fees;
  const adjustment = finalTotal > totalWithoutAdjustment ? finalTotal - totalWithoutAdjustment : 0;
  const totalFeePool = fees + adjustment;

  const splits = members.map(member => {
    const userId = member._id.toString();
    const subtotal = userSubtotals[userId] || 0;
    const proportion = totalItemsCost > 0 ? subtotal / totalItemsCost : 0;
    const amountOwed = subtotal + proportion * totalFeePool;

    return {
      userId,
      amountOwed: Math.round(amountOwed)
    };
  });

  return splits;
};

module.exports = calculateSplit;
