"use client";

export function LeftPanel() {
  return (
    <div className="h-full w-full md:w-80 border border-border rounded-lg md:rounded-xl overflow-y-auto" style={{ backgroundColor: "var(--app-secondary)" }}>
      <div className="p-3 sm:p-4">
        <h2 className="text-base sm:text-lg font-medium mb-3 sm:mb-4">Left Panel</h2>
        {/* Add your content here */}
      </div>
    </div>
  );
}
