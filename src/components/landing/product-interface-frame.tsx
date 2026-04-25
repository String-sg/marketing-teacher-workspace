export function ProductInterfaceFrame() {
  return (
    <div className="overflow-hidden rounded-[1.4rem] border border-white/10 bg-[color:var(--interface-panel)] p-4 shadow-2xl shadow-black/40 backdrop-blur-sm">
      <div className="grid min-h-[56svh] gap-4 rounded-[1rem] border border-white/8 bg-[color:var(--interface-surface)] p-4 text-white sm:grid-cols-[15rem_1fr]">
        <aside className="hidden flex-col gap-3 border-r border-white/8 pr-4 text-sm text-white/54 sm:flex">
          <p className="text-white/82">Teacher Workspace</p>
          {["Today", "Classes", "To grade", "Students", "Library"].map(
            (item, index) => (
              <span
                className={
                  index === 0
                    ? "rounded-lg bg-white/10 px-3 py-2 text-white"
                    : "px-3 py-2"
                }
                key={item}
              >
                {item}
              </span>
            )
          )}
        </aside>
        <div className="flex min-w-0 flex-col gap-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm text-[color:var(--interface-accent)]">
                Today's workspace
              </p>
              <h2 className="mt-2 max-w-xl text-3xl font-semibold text-balance sm:text-5xl">
                Good morning, Sam. Here's today.
              </h2>
            </div>
            <div className="rounded-full bg-[color:var(--interface-accent-soft)] px-4 py-2 text-sm text-[color:var(--interface-accent)]">
              12 to grade
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1fr_18rem]">
            <div className="rounded-xl border border-white/8 bg-white/[0.045] p-4">
              <div className="mb-4 flex items-center justify-between text-sm text-white/54">
                <span>Today at a glance</span>
                <span>4 classes</span>
              </div>
              <div className="chart-path" />
            </div>
            <div className="rounded-xl border border-white/8 bg-white/[0.045] p-4">
              <p className="text-sm text-white/54">Next up</p>
              <p className="mt-3 text-2xl font-medium">Bio Period 3 quiz</p>
              <p className="mt-5 text-sm leading-6 text-white/62">
                Attendance is ready, the rubric is attached, and yesterday's
                parent note is waiting for review.
              </p>
            </div>
          </div>

          <div className="grid gap-3 text-sm text-white/68 sm:grid-cols-3">
            {["Attendance", "Grading", "Messages"].map((label) => (
              <div
                className="rounded-xl border border-white/8 bg-white/[0.035] p-4"
                key={label}
              >
                <p>{label}</p>
                <div className="mt-4 h-2 rounded-full bg-white/10">
                  <div className="h-full w-4/5 rounded-full bg-[color:var(--interface-accent)]" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
