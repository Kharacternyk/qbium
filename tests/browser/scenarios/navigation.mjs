export default async function navigation(page, { origin }) {
  await page.key("o");
  await page.type(`${origin}/prompt`);
  await page.key("Enter");
  await page.waitPath("/prompt");
  await page.key("d");
  await page.type(`${origin}/edited`);
  await page.key("Enter");
  await page.waitPath("/edited");
  await page.key("H");
  await page.waitPath("/prompt");
  await page.key("L");
  await page.waitPath("/edited");
}
