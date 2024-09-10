function processText(text) {
  if (text.includes("```")) {
    text = text.replace(/```/g, "").replace(/json/i, "");
    return `${text}`;
  }
  return `${text}`;
}

module.exports = { processText };
