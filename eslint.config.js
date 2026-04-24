//  @ts-check

import { tanstackConfig } from "@tanstack/eslint-config"

export default [
  {
    ignores: [".output/**", ".vinxi/**", "dist/**", "node_modules/**"],
  },
  ...tanstackConfig,
]
