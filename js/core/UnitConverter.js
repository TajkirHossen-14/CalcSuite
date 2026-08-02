/**
 * UnitConverter.js — the generic conversion engine.
 *
 * A unit is described either by a linear `factor` relative to the category's
 * base unit (value_in_base = value × factor) …or, when the relationship is not
 * a simple ratio (temperature!), by an explicit `toBase` / `fromBase` pair.
 *
 * Because of that escape hatch, the same class powers length, weight, volume,
 * area, speed, data, power, voltage, frequency, energy *and* temperature.
 */
export class UnitConverter {
  /**
   * @param {Object} units  map of unitId -> { name, symbol, factor } | { name, symbol, toBase, fromBase }
   * @param {Object} [options] { name, baseSymbol }
   */
  constructor(units, options = {}) {
    this.units = units;
    this.options = options;
    this.ids = Object.keys(units);
    if (!this.ids.length) throw new Error('UnitConverter needs at least one unit');
  }

  unit(id) {
    const u = this.units[id];
    if (!u) throw new Error(`Unknown unit: ${id}`);
    return u;
  }

  label(id) {
    const u = this.unit(id);
    return u.symbol ? `${u.name} (${u.symbol})` : u.name;
  }

  symbol(id) {
    const u = this.unit(id);
    return u.symbol || u.name;
  }

  /** Convert a value expressed in `id` into the category's base unit. */
  toBase(value, id) {
    const u = this.unit(id);
    return typeof u.toBase === 'function' ? u.toBase(value) : value * u.factor;
  }

  /** Convert a base-unit value into `id`. */
  fromBase(baseValue, id) {
    const u = this.unit(id);
    return typeof u.fromBase === 'function' ? u.fromBase(baseValue) : baseValue / u.factor;
  }

  /** The whole point of the class: value ÷ fromFactor × toFactor, in one call. */
  convert(value, from, to) {
    const n = Number(value);
    if (!Number.isFinite(n)) return NaN;
    if (from === to) return n;
    return this.fromBase(this.toBase(n, from), to);
  }

  /** Convert once, read everywhere — used by the "all units" panel. */
  toAll(value, from) {
    const base = this.toBase(Number(value), from);
    return this.ids.map((id) => ({
      id,
      name: this.units[id].name,
      symbol: this.symbol(id),
      value: this.fromBase(base, id)
    }));
  }

  /** Build <option> markup once; reused by both selects. */
  optionsHTML(selected) {
    return this.ids
      .map((id) => `<option value="${id}"${id === selected ? ' selected' : ''}>${this.label(id)}</option>`)
      .join('');
  }

  /** Grouped <optgroup> markup when units declare a `group`. */
  groupedOptionsHTML(selected) {
    const groups = new Map();
    this.ids.forEach((id) => {
      const g = this.units[id].group || '';
      if (!groups.has(g)) groups.set(g, []);
      groups.get(g).push(id);
    });
    if (groups.size <= 1) return this.optionsHTML(selected);
    return Array.from(groups.entries())
      .map(([name, ids]) => `<optgroup label="${name || 'Other'}">${ids
        .map((id) => `<option value="${id}"${id === selected ? ' selected' : ''}>${this.label(id)}</option>`)
        .join('')}</optgroup>`)
      .join('');
  }
}

/** Convenience: build a linear unit map from [id, name, symbol, factor] tuples. */
export function linearUnits(rows) {
  return rows.reduce((acc, [id, name, symbol, factor, group]) => {
    acc[id] = { name, symbol, factor, ...(group ? { group } : {}) };
    return acc;
  }, {});
}
