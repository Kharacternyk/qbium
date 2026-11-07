import rankHistory from "../shared/rank-history.mjs";

export default async function searchHistory(history, query) {
  if (typeof query !== "string" || query.length > 256) {
    throw new Error("Invalid history query");
  }

  const items = await history.search({
    text: "",
    startTime: 0,
    maxResults: 10000,
  });

  return rankHistory(items, query);
}
