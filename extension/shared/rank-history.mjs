import fuzzyScore from "./fuzzy-score.mjs";

export default function rankHistory(items, query, limit = 10) {
  const words = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);

  return items
    .filter((item) => /^https?:\/\//i.test(item.url || ""))
    .map((item) => ({
      item,
      score: words.reduce((total, word) => {
        const titleScore = fuzzyScore(item.title || "", word);
        const urlScore = fuzzyScore(item.url, word);

        return total + Math.max(titleScore, urlScore);
      }, 0),
    }))
    .filter(({ score }) => Number.isFinite(score))
    .sort((a, b) => {
      const relevance = b.score - a.score;
      const recency = (b.item.lastVisitTime || 0) - (a.item.lastVisitTime || 0);

      return relevance || recency;
    })
    .slice(0, limit)
    .map(({ item }) => ({
      url: item.url,
      title: item.title || item.url,
    }));
}
