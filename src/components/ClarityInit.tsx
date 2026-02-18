'use client'

import { useEffect } from 'react'
import Clarity from '@microsoft/clarity'

export function ClarityInit() {
  useEffect(() => {
    Clarity.init('vj7vtjt3q2')
  }, [])

  return null
}
