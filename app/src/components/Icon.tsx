import type { SVGProps } from 'react'

export type IconName =
  | 'overview'
  | 'map'
  | 'simulation'
  | 'planner'
  | 'reports'
  | 'layers'
  | 'play'
  | 'reset'
  | 'crosshair'
  | 'alert'
  | 'check'
  | 'info'
  | 'download'
  | 'close'
  | 'chevron'

const PATHS: Record<IconName, string> = {
  overview:
    'M3 13h8V3H3v10Zm0 8h8v-6H3v6Zm10 0h8V11h-8v10Zm0-18v6h8V3h-8Z',
  map: 'M9 3 3 5v16l6-2 6 2 6-2V3l-6 2-6-2Zm0 2.2 4 1.33v13.3l-4-1.33V5.2Zm-4 1.1 2-.67v13.3l-2 .67V6.3Zm10 1.33 4-1.33v13.3l-4 1.33V7.63Z',
  simulation:
    'M4 19h16v2H4v-2Zm2-3 4-4 3 3 5-6v10H6Zm-1.4-9.6L16 0l1.4 1.4-2.3 2.3 3 3L20 5.4 21.4 6.8 15 13.2l-3-3-3.09 3.09L7.5 11.9l3.09-3.09L7.5 5.72 6.4 6.8 5 5.4Z',
  planner:
    'M3 5h18v2H3V5Zm0 6h12v2H3v-2Zm0 6h18v2H3v-2Zm14-6.5 2 1.5-2 1.5v-3Z',
  reports:
    'M6 2h9l5 5v15a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1Zm8 1.5V8h4.5L14 3.5ZM8 12h8v2H8v-2Zm0 4h8v2H8v-2Zm0-8h4v2H8V8Z',
  layers:
    'M12 2 2 7l10 5 10-5-10-5Zm0 7.7L3.3 5 12 3.3 20.7 5 12 9.7ZM2 12l10 5 10-5-1.4-.7L12 15.3 3.4 11.3 2 12Zm0 5 10 5 10-5-1.4-.7L12 20.3 3.4 16.3 2 17Z',
  play: 'M8 5v14l11-7L8 5Z',
  reset:
    'M12 5V2L7 6l5 4V7a5 5 0 1 1-5 5H5a7 7 0 1 0 7-7Z',
  crosshair:
    'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm1 2.06A8 8 0 0 1 19.94 11H17a1 1 0 1 0-2 0h-2V4.06Zm-2 0V11H9a1 1 0 1 0-2 0H4.06A8 8 0 0 1 11 4.06ZM4.06 13H7a1 1 0 1 0 2 0h2v6.94A8 8 0 0 1 4.06 13Zm8.94 6.94V13h2a1 1 0 1 0 2 0h2.94A8 8 0 0 1 13 19.94Z',
  alert:
    'M12 2 1 21h22L12 2Zm0 4.1L19.5 19h-15L12 6.1ZM11 10v5h2v-5h-2Zm0 6.5v2h2v-2h-2Z',
  check: 'M9.5 17.2 4.8 12.5l1.4-1.4 3.3 3.3 8.3-8.3 1.4 1.4-9.7 9.7Z',
  info: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm1 15h-2v-6h2v6Zm0-8h-2V7h2v2Z',
  download: 'M12 3v10.6l3.3-3.3 1.4 1.4L12 17.4l-4.7-4.7 1.4-1.4 3.3 3.3V3h2ZM5 19h14v2H5v-2Z',
  close: 'M18.3 5.7 12 12l6.3 6.3-1.4 1.4L10.6 13.4 4.3 19.7 2.9 18.3 9.2 12 2.9 5.7 4.3 4.3l6.3 6.3 6.3-6.3 1.4 1.4Z',
  chevron: 'M7.4 8.6 12 13.2l4.6-4.6L18 10l-6 6-6-6 1.4-1.4Z',
}

interface IconProps extends SVGProps<SVGSVGElement> {
  name: IconName
  size?: number
}

export function Icon({ name, size = 18, ...rest }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      <path d={PATHS[name]} />
    </svg>
  )
}
