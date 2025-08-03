import {
  GitBranchIcon,
  HomeIcon,
  LifeBuoyIcon,
  SettingsIcon,
  Share2Icon,
  SquareTerminalIcon,
  TriangleIcon,
} from "lucide-react"
import { NavLink } from "./sidebar-types"

export const NAV_LINKS: NavLink[] = [
  { href: "/", label: "Home", icon: HomeIcon },
  {
    label: "Workspace",
    icon: TriangleIcon,
    subLinks: [
      { href: "/settings", label: "Settings", icon: SettingsIcon },
      {
        href: "/getting-started",
        label: "Getting Started",
        icon: LifeBuoyIcon,
      },
    ],
  },
  {
    label: "Development",
    icon: GitBranchIcon,
    subLinks: [
      { href: "/cli", label: "CLI", icon: SquareTerminalIcon },
      { href: "/api-reference", label: "API Reference", icon: LifeBuoyIcon },
    ],
  },
]
