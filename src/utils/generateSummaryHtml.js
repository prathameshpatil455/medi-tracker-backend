export const generateSummaryHTML = ({ name, income, expense, netSavings }) => {
  const badgeColors = [
    "#4CAF50",
    "#2196F3",
    "#FF9800",
    "#9C27B0",
    "#F44336",
    "#00BCD4",
    "#8BC34A",
  ];

  const formatBadges = (data) =>
    Object.entries(data)
      .map(([cat, percent], index) => {
        const color = badgeColors[index % badgeColors.length];
        return `<span style="
          display: inline-block;
          background-color: ${color};
          color: white;
          padding: 6px 12px;
          border-radius: 20px;
          margin: 4px 4px 4px 0;
          font-size: 13px;
        ">
          ${cat}: ${percent}
        </span>`;
      })
      .join("");

  return `
    <div style="font-family: Arial, sans-serif; color: #333; padding: 16px;">
      <h2 style="color: #2E7D32;">Hello ${name},</h2>
      <p>Here’s your <strong>WalletWise</strong> summary:</p>

      <div style="margin: 16px 0;">
        <h3 style="color: #388E3C;">💰 Income</h3>
        <p>Total: <strong>₹${income.total}</strong></p>
        <div>${formatBadges(income.breakdown)}</div>
      </div>

      <div style="margin: 16px 0;">
        <h3 style="color: #D32F2F;">💸 Expenses</h3>
        <p>Total: <strong>₹${expense.total}</strong></p>
        <div>${formatBadges(expense.breakdown)}</div>
      </div>

      <div style="margin: 16px 0;">
        <h3 style="color: #1976D2;">💼 Net Savings: ₹${netSavings}</h3>
      </div>

      <div style="margin-top: 24px; background-color: #f5f5f5; padding: 12px; border-left: 4px solid #FFC107;">
        <strong>💡 Tip:</strong> ${generateBasicAdvice(income, expense)}
      </div>

      <p style="margin-top: 32px;">Stay wise with <strong>WalletWise</strong>! 💼</p>
    </div>
  `;
};

function generateBasicAdvice(income, expense) {
  if (expense.total > income.total) {
    return "Your expenses exceed income. Try reducing non-essential spending.";
  }

  const topExpense = Object.entries(expense.breakdown).sort(
    (a, b) => parseFloat(b[1]) - parseFloat(a[1])
  )[0];

  if (topExpense) {
    return `You spent the most on <strong>${topExpense[0]}</strong>. Consider optimizing that category.`;
  }

  return "Keep tracking your finances regularly!";
}
