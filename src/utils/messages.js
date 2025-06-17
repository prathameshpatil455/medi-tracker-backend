const motivationalMessages = [
  "Track today, save tomorrow 💰",
  "You're building wealth, one entry at a time 📈",
  "Don't forget to add your expenses today! 📝",
  "Money flows where awareness goes 💡",
  "Consistency beats intensity — log it now ✅",
];

function getRandomMessage() {
  const index = Math.floor(Math.random() * motivationalMessages.length);
  return motivationalMessages[index];
}

export default getRandomMessage;
