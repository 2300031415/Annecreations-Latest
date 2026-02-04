import React from 'react';

const SortSelect = ({ sortOption, onChange }) => (
  <div className="flex items-center gap-2">
    <label
      htmlFor="sort"
      className="text-sm font-medium text-transparent bg-clip-text bg-[linear-gradient(to_left,_#996E19_10%,_var(--primary))]"
    >
      Sort by:
    </label>
    <select
      id="sort"
      value={sortOption}
      onChange={(e) => onChange(e.target.value)}
      className="text-[var(--secondary)] border-[var(--primary)] border-2 rounded px-3 py-1 text-sm"
    >
      <option value="default">Default</option>
      <option value="low-high">low-high</option>
      <option value="high-low">high-low</option>
    </select>
  </div>
);

export default SortSelect;
