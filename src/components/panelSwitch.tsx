import { ReactNode } from 'react'

type Key = string | number

interface PanelSwitchProps {
  panels: Record<Key, ReactNode>
  activeKey: Key
}

// Conditionally render a panel based on the active key, hiding the rest of panels
// Use display:none instead of unmounting the component to keep the state and avoid re-rendering
export const PanelSwitch = ({ panels, activeKey }: PanelSwitchProps) =>
  Object.keys(panels).map((mappedKey) => (
    <div
      key={mappedKey}
      className={mappedKey === activeKey.toString() ? 'block' : 'hidden'}
    >
      {panels[mappedKey]}
    </div>
  ))
