"use client"

import { useMemo } from "react"

interface QrCodeProps {
  data: string
  size?: number
  className?: string
}

// Simple QR-code-like SVG generator (visual representation)
export function QrCode({ data, size = 200, className }: QrCodeProps) {
  const modules = useMemo(() => {
    // Generate a deterministic pattern from data string
    const gridSize = 21
    const grid: boolean[][] = []
    let hash = 0
    for (let i = 0; i < data.length; i++) {
      hash = (hash << 5) - hash + data.charCodeAt(i)
      hash |= 0
    }

    for (let row = 0; row < gridSize; row++) {
      grid[row] = []
      for (let col = 0; col < gridSize; col++) {
        // Position detection patterns (corners)
        if (
          (row < 7 && col < 7) ||
          (row < 7 && col >= gridSize - 7) ||
          (row >= gridSize - 7 && col < 7)
        ) {
          // Outer border
          if (row === 0 || row === 6 || col === 0 || col === 6 ||
            (row >= gridSize - 7 && (row === gridSize - 7 || row === gridSize - 1)) ||
            (col >= gridSize - 7 && (col === gridSize - 7 || col === gridSize - 1))
          ) {
            grid[row][col] = true
          } else if (
            (row >= 2 && row <= 4 && col >= 2 && col <= 4) ||
            (row >= 2 && row <= 4 && col >= gridSize - 5 && col <= gridSize - 3) ||
            (row >= gridSize - 5 && row <= gridSize - 3 && col >= 2 && col <= 4)
          ) {
            grid[row][col] = true
          } else {
            grid[row][col] = false
          }
        } else {
          // Data modules - deterministic pseudo-random based on data hash
          const seed = Math.abs(hash * (row + 1) * 31 + (col + 1) * 17)
          grid[row][col] = seed % 3 !== 0
        }
      }
    }
    return grid
  }, [data])

  const cellSize = size / 21
  const margin = 8

  return (
    <div className={className}>
      <svg
        width={size + margin * 2}
        height={size + margin * 2}
        viewBox={`0 0 ${size + margin * 2} ${size + margin * 2}`}
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label={`QR Code for ${data}`}
      >
        <rect x="0" y="0" width={size + margin * 2} height={size + margin * 2} fill="white" rx="8" />
        {modules.map((row, rowIndex) =>
          row.map((cell, colIndex) =>
            cell ? (
              <rect
                key={`${rowIndex}-${colIndex}`}
                x={margin + colIndex * cellSize}
                y={margin + rowIndex * cellSize}
                width={cellSize}
                height={cellSize}
                fill="black"
                rx={1}
              />
            ) : null
          )
        )}
      </svg>
    </div>
  )
}
