export default class Selection {
  items = [];
  index = -1;
  draft = "";

  reset(draft, items = []) {
    this.draft = draft;
    this.items = items;
    this.index = -1;
  }

  choose(index) {
    if (index >= -1 && index < this.items.length) {
      this.index = index;
    }
  }

  move(direction) {
    if (!this.items.length) {
      return;
    }

    let next = this.index + direction;

    if (next >= this.items.length) {
      next = -1;
    }

    if (next < -1) {
      next = this.items.length - 1;
    }

    this.index = next;
  }

  get value() {
    return this.index < 0 ? this.draft : this.items[this.index].url;
  }
}
