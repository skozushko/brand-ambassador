declare module "react-simple-maps" {
  import { ReactNode, CSSProperties } from "react"

  interface ComposableMapProps {
    projection?: string
    projectionConfig?: Record<string, unknown>
    style?: CSSProperties
    children?: ReactNode
  }

  interface GeographiesProps {
    geography: string | object
    children: (props: { geographies: Geography[] }) => ReactNode
  }

  interface Geography {
    rsmKey: string
    id: number | string
    properties: Record<string, unknown>
  }

  interface GeographyProps {
    geography: Geography
    fill?: string
    stroke?: string
    strokeWidth?: number
    style?: {
      default?: CSSProperties & { fill?: string; outline?: string }
      hover?: CSSProperties & { fill?: string; outline?: string }
      pressed?: CSSProperties & { fill?: string; outline?: string }
    }
  }

  interface MarkerProps {
    coordinates: [number, number]
    children?: ReactNode
  }

  export function ComposableMap(props: ComposableMapProps): JSX.Element
  export function Geographies(props: GeographiesProps): JSX.Element
  export function Geography(props: GeographyProps): JSX.Element
  export function Marker(props: MarkerProps): JSX.Element
}
