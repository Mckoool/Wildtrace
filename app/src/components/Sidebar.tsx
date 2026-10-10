import { Icon } from './Icon'
import { NAV_ITEMS, type Species, type StudyArea, type ViewId } from '../lib/nav'

export interface SidebarStatus {
  source: 'backend' | 'demo'
  backendConfigured: boolean
  candidateCount: number
  loading: boolean
}

interface SidebarProps {
  activeView: ViewId
  onSelectView: (view: ViewId) => void
  studyAreas: StudyArea[]
  studyAreaId: string
  onStudyAreaChange: (id: string) => void
  species: Species
  observationCount: number
  status: SidebarStatus
}

export function Sidebar({
  activeView,
  onSelectView,
  studyAreas,
  studyAreaId,
  onStudyAreaChange,
  species,
  observationCount,
  status,
}: SidebarProps) {
  const online = status.source === 'backend'

  return (
    <aside className="flex w-full shrink-0 flex-col border-b border-[#1c2a23] bg-[#0c1611] lg:h-full lg:w-[248px] lg:border-b-0 lg:border-r">
      <div className="flex items-center gap-3 border-b border-[#1c2a23] px-5 py-5">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30">
          <Icon name="map" size={20} />
        </span>
        <div className="leading-tight">
          <div className="text-[15px] font-semibold tracking-tight text-slate-100">
            WildTrace
          </div>
          <div className="text-[11px] text-slate-500">Conservation Simulator</div>
        </div>
      </div>

      <nav
        className="flex flex-row gap-1 overflow-x-auto px-3 py-4 lg:flex-col lg:overflow-visible"
        aria-label="Main"
      >
        {NAV_ITEMS.map((item) => {
          const active = item.id === activeView
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectView(item.id)}
              aria-current={active ? 'page' : undefined}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-left text-[13px] font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60 ${
                active
                  ? 'bg-emerald-500/12 text-emerald-300 ring-1 ring-inset ring-emerald-500/25'
                  : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
              }`}
            >
              <Icon name={item.icon} size={17} />
              {item.label}
            </button>
          )
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-4 border-t border-[#1c2a23] px-4 py-4">
        <div>
          <label
            htmlFor="study-area"
            className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-slate-500"
          >
            Study area
          </label>
          <select
            id="study-area"
            value={studyAreaId}
            onChange={(event) => onStudyAreaChange(event.target.value)}
            className="w-full rounded-lg border border-[#24362c] bg-[#0a120e] px-3 py-2 text-[13px] text-slate-200 focus:border-emerald-500/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
          >
            {studyAreas.map((area) => (
              <option key={area.id} value={area.id}>
                {area.name}, {area.country}
              </option>
            ))}
          </select>
        </div>

        <div className="rounded-lg border border-[#24362c] bg-[#0a120e] p-3">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Target species
          </div>
          <div className="mt-1 text-[13px] font-semibold text-slate-100">
            {species.commonName}
          </div>
          <div className="text-[11px] italic text-slate-500">{species.scientificName}</div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
            <span>GPS observations</span>
            <span className="font-medium text-slate-200">
              {observationCount.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[11px]">
          <span
            className={`h-2 w-2 rounded-full ${
              status.loading
                ? 'animate-pulse bg-amber-400'
                : online
                  ? 'bg-emerald-400'
                  : 'bg-sky-400'
            }`}
          />
          <span className="text-slate-400">
            {status.loading
              ? 'Connecting…'
              : online
                ? `Backend online · ${status.candidateCount} candidates`
                : status.backendConfigured
                  ? 'Demonstration mode · backend offline'
                  : 'Demonstration mode · not configured'}
          </span>
        </div>
      </div>
    </aside>
  )
}
