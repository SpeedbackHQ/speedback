import html2canvas from 'html2canvas'

/**
 * Generate a PNG poster from an HTML element
 * Uses html2canvas to convert the element to a downloadable image
 */
export async function generatePosterPNG(
  element: HTMLElement,
  filename: string,
  width?: number,
  height?: number
): Promise<void> {
  try {
    // Generate canvas from HTML element
    const canvas = await html2canvas(element, {
      scale: 2, // 2x for retina quality
      backgroundColor: null,
      logging: false,
      useCORS: true,
      allowTaint: true,
      width: width,
      height: height,
    })

    // Convert canvas to blob and trigger download
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `${filename}.png`
        link.click()

        // Clean up
        URL.revokeObjectURL(url)
      }
    }, 'image/png')
  } catch (error) {
    console.error('Error generating poster:', error)
    throw new Error('Failed to generate poster')
  }
}

/**
 * Get a preview blob of the poster (for display purposes)
 */
export async function getPosterPreview(
  element: HTMLElement,
  width?: number,
  height?: number
): Promise<string | null> {
  try {
    const canvas = await html2canvas(element, {
      scale: 1,
      backgroundColor: null,
      logging: false,
      useCORS: true,
      allowTaint: true,
      width: width,
      height: height,
    })

    return canvas.toDataURL('image/png')
  } catch (error) {
    console.error('Error generating preview:', error)
    return null
  }
}
